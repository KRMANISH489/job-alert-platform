import json
import re
import secrets
import time
from urllib.parse import urlparse

import bcrypt
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db import get_db
from app.models import Application, Company, Education, Employment, Job, JobAlert, SavedJob, Skill, User
from app.tokens import decode_token

app = FastAPI(title="JobAlert API")

CATEGORIES = ["Engineering", "Design", "Product", "Data", "Marketing", "Sales", "Operations", "Finance"]
JOB_TYPES = ["full-time", "part-time", "contract", "internship"]
WORKPLACES = ["remote", "hybrid", "onsite"]
EXPERIENCE = ["fresher", "1-3", "3-6", "6+"]
STATUSES = ["submitted", "reviewing", "shortlisted", "rejected"]
NOTICE = ["Immediate", "15 days", "30 days", "45 days", "60 days", "90 days", "More than 90 days"]
GENDERS = ["Female", "Male", "Other", "Prefer not to say"]
SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"]


def now_ms() -> int:
    return int(time.time() * 1000)


def new_id() -> str:
    return "c" + secrets.token_hex(12)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:48]
    return slug or "item"


def digits(phone: str) -> str:
    return re.sub(r"\D", "", phone)


def session_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role if user.role in {"employer", "admin"} else "seeker",
        "companyId": user.companyId,
    }


def company_json(company: Company) -> dict:
    return {
        "id": company.id,
        "name": company.name,
        "slug": company.slug,
        "website": company.website,
        "about": company.about,
        "location": company.location,
        "size": company.size,
        "hrName": company.hrName,
        "hrPhone": company.hrPhone,
        "hrEmail": company.hrEmail,
        "approved": bool(company.approved),
        "createdAt": company.createdAt,
    }


def job_json(job: Job, applications: int | None = None) -> dict:
    payload = {
        "id": job.id,
        "slug": job.slug,
        "title": job.title,
        "companyId": job.companyId,
        "location": job.location,
        "workplace": job.workplace,
        "type": job.type,
        "experience": job.experience,
        "salaryMin": job.salaryMin,
        "salaryMax": job.salaryMax,
        "currency": job.currency,
        "category": job.category,
        "description": job.description,
        "requirements": job.requirements,
        "status": job.status,
        "featured": bool(job.featured),
        "hrName": job.hrName,
        "hrPhone": job.hrPhone,
        "hrEmail": job.hrEmail,
        "createdAt": job.createdAt,
        "company": company_json(job.company),
    }
    if applications is not None:
        payload["_count"] = {"applications": applications}
    return payload


def profile_json(user: User) -> dict:
    skills = sorted(user.skills, key=lambda skill: skill.name.lower())
    jobs = sorted(
        user.employments,
        key=lambda item: (not item.current, -item.startYear, -item.startMonth),
    )
    studies = sorted(user.educations, key=lambda item: -item.endYear)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "headline": user.headline,
        "resumeHeadline": user.resumeHeadline,
        "location": user.location,
        "bio": user.bio,
        "experienceYears": user.experienceYears,
        "currentCompany": user.currentCompany,
        "currentCtc": user.currentCtc,
        "expectedCtc": user.expectedCtc,
        "noticePeriod": user.noticePeriod,
        "preferredLocations": user.preferredLocations,
        "preferredType": user.preferredType,
        "dateOfBirth": user.dateOfBirth,
        "gender": user.gender,
        "languages": user.languages,
        "industry": user.industry,
        "department": user.department,
        "skills": [{"id": skill.id, "name": skill.name} for skill in skills],
        "employments": [
            {
                "id": item.id,
                "designation": item.designation,
                "company": item.company,
                "location": item.location,
                "startMonth": item.startMonth,
                "startYear": item.startYear,
                "endMonth": item.endMonth,
                "endYear": item.endYear,
                "current": bool(item.current),
                "description": item.description,
            }
            for item in jobs
        ],
        "educations": [
            {
                "id": item.id,
                "degree": item.degree,
                "specialization": item.specialization,
                "institute": item.institute,
                "endYear": item.endYear,
                "score": item.score,
            }
            for item in studies
        ],
    }


def build_resume(user: User) -> str:
    profile = profile_json(user)
    snapshot = {
        "name": profile["name"],
        "email": profile["email"],
        "phone": profile["phone"],
        "headline": profile["headline"],
        "resumeHeadline": profile["resumeHeadline"],
        "location": profile["location"],
        "bio": profile["bio"],
        "experienceYears": profile["experienceYears"],
        "currentCompany": profile["currentCompany"],
        "currentCtc": profile["currentCtc"],
        "expectedCtc": profile["expectedCtc"],
        "noticePeriod": profile["noticePeriod"],
        "preferredLocations": profile["preferredLocations"],
        "preferredType": profile["preferredType"],
        "dateOfBirth": profile["dateOfBirth"],
        "gender": profile["gender"],
        "languages": profile["languages"],
        "industry": profile["industry"],
        "department": profile["department"],
        "skills": [skill["name"] for skill in profile["skills"]],
        "employments": [
            {key: item[key] for key in ("designation", "company", "location", "startMonth", "startYear", "endMonth", "endYear", "current", "description")}
            for item in profile["employments"]
        ],
        "educations": [
            {key: item[key] for key in ("degree", "specialization", "institute", "endYear", "score")}
            for item in profile["educations"]
        ],
    }
    return json.dumps(snapshot)


def load_profile(db: Session, user_id: str) -> User:
    user = (
        db.query(User)
        .options(joinedload(User.skills), joinedload(User.employments), joinedload(User.educations))
        .filter(User.id == user_id)
        .one()
    )
    return user


def require_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in required.")
    user_id = decode_token(authorization.split(" ", 1)[1].strip())
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in required.")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")
    return user


def require_seeker(user: User = Depends(require_user)) -> User:
    if user.role != "seeker":
        raise HTTPException(status_code=403, detail="Sign in with a job seeker account.")
    return user


def require_employer(user: User = Depends(require_user)) -> User:
    if user.role != "employer" or not user.companyId:
        raise HTTPException(status_code=403, detail="Sign in with a company account.")
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Main admin only.")
    return user


def clean_website(raw: str) -> str:
    if not raw:
        return ""
    candidate = raw if re.match(r"^https?://", raw, re.I) else f"https://{raw}"
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="That website address doesn't look right.")
    return candidate


def unique_slug(db: Session, model, value: str, fallback: str) -> str:
    base = slugify(value) or fallback
    slug = base
    index = 2
    while db.query(model).filter(model.slug == slug).first():
        slug = f"{base}-{index}"
        index += 1
    return slug


class LoginBody(BaseModel):
    email: str
    password: str


class SignupBody(BaseModel):
    name: str
    email: str
    password: str
    role: str
    companyName: str = ""


class ApplyBody(BaseModel):
    note: str


class AlertBody(BaseModel):
    keyword: str
    location: str = ""
    category: str = ""


class CompanyBody(BaseModel):
    name: str
    location: str = ""
    size: str = ""
    about: str = ""
    website: str = ""
    hrName: str
    hrPhone: str
    hrEmail: str = ""


class JobBody(BaseModel):
    title: str
    location: str
    workplace: str
    type: str
    experience: str
    category: str
    description: str
    requirements: str
    salaryMin: int | None = None
    salaryMax: int | None = None
    status: str | None = None
    hrName: str
    hrPhone: str
    hrEmail: str = ""


class StatusBody(BaseModel):
    status: str


class FlagsBody(BaseModel):
    status: str | None = None
    featured: bool | None = None


class AccessBody(BaseModel):
    approved: bool


class BasicBody(BaseModel):
    name: str
    headline: str = ""
    currentCompany: str = ""
    location: str = ""
    phone: str = ""
    experienceYears: int | None = None
    resumeHeadline: str = ""
    bio: str = ""


class CareerBody(BaseModel):
    currentCtc: int | None = None
    expectedCtc: int | None = None
    noticePeriod: str = ""
    preferredLocations: str = ""
    preferredType: str = ""
    industry: str = ""
    department: str = ""


class PersonalBody(BaseModel):
    dateOfBirth: str = ""
    gender: str = ""
    languages: str = ""


class SkillBody(BaseModel):
    name: str


class EmploymentBody(BaseModel):
    id: str = ""
    designation: str
    company: str
    location: str = ""
    startMonth: int
    startYear: int
    endMonth: int | None = None
    endYear: int | None = None
    current: bool = False
    description: str = ""


class EducationBody(BaseModel):
    id: str = ""
    degree: str
    specialization: str = ""
    institute: str
    endYear: int
    score: str = ""


def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/auth/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not check_password(body.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="That email and password don't match.")
    return session_user(user)


@app.post("/auth/signup")
def signup(body: SignupBody, db: Session = Depends(get_db)):
    role = "employer" if body.role == "employer" else "seeker"
    name = body.name.strip()
    email = body.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if len(name) < 2 or len(name) > 80:
        raise HTTPException(status_code=400, detail="Add your name.")
    if len(body.password) < 8 or len(body.password) > 72:
        raise HTTPException(status_code=400, detail="Use a password of at least 8 characters.")
    if role == "employer" and len(body.companyName.strip()) < 2:
        raise HTTPException(status_code=400, detail="Add your company name.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists. Sign in instead.")

    company = None
    if role == "employer":
        company = Company(
            id=new_id(),
            name=body.companyName.strip()[:80],
            slug=unique_slug(db, Company, body.companyName, "company"),
            approved=False,
            createdAt=now_ms(),
        )
        db.add(company)
        db.flush()

    user = User(
        id=new_id(),
        email=email,
        passwordHash=hash_password(body.password),
        name=name,
        role=role,
        companyId=company.id if company else None,
        createdAt=now_ms(),
    )
    db.add(user)
    db.commit()
    return session_user(user)


@app.get("/auth/me")
def me(user: User = Depends(require_user)):
    return session_user(user)


def job_query(db: Session):
    return db.query(Job).options(joinedload(Job.company))


@app.get("/jobs")
def list_jobs(
    q: str = "",
    location: str = "",
    category: str = "",
    type: str = "",
    workplace: str = "",
    experience: str = "",
    db: Session = Depends(get_db),
):
    query = job_query(db).filter(Job.status == "open")
    if q:
        like = f"%{q[:80]}%"
        query = query.filter(
            or_(
                Job.title.ilike(like),
                Job.description.ilike(like),
                Job.category.ilike(like),
                Job.company.has(Company.name.ilike(like)),
            )
        )
    if location:
        query = query.filter(Job.location.ilike(f"%{location[:80]}%"))
    if category in CATEGORIES:
        query = query.filter(Job.category == category)
    if type in JOB_TYPES:
        query = query.filter(Job.type == type)
    if workplace in WORKPLACES:
        query = query.filter(Job.workplace == workplace)
    if experience in EXPERIENCE:
        query = query.filter(Job.experience == experience)
    jobs = query.order_by(Job.featured.desc(), Job.createdAt.desc()).all()
    return [job_json(job) for job in jobs]


@app.get("/board")
def board(db: Session = Depends(get_db)):
    open_jobs = job_query(db).filter(Job.status == "open")
    latest = open_jobs.order_by(Job.featured.desc(), Job.createdAt.desc()).limit(6).all()
    counts = db.query(Job.category, func.count(Job.id)).filter(Job.status == "open").group_by(Job.category).all()
    return {
        "openCount": db.query(func.count(Job.id)).filter(Job.status == "open").scalar() or 0,
        "companyCount": db.query(func.count(Company.id)).scalar() or 0,
        "latest": [job_json(job) for job in latest],
        "categories": [{"category": category, "count": count} for category, count in counts],
    }


@app.get("/jobs/{slug}")
def job_by_slug(slug: str, db: Session = Depends(get_db)):
    job = job_query(db).filter(Job.slug == slug, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    return job_json(job)


@app.get("/jobs/{slug}/context")
def job_context(slug: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.slug == slug, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    application = db.query(Application).filter(Application.jobId == job.id, Application.userId == user.id).first()
    saved = db.query(SavedJob).filter(SavedJob.jobId == job.id, SavedJob.userId == user.id).first()
    profile = load_profile(db, user.id)
    return {
        "application": None
        if not application
        else {"id": application.id, "status": application.status, "createdAt": application.createdAt, "note": application.note},
        "saved": saved is not None,
        "profile": profile_json(profile),
    }


@app.get("/companies/{slug}")
def company_page(slug: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.slug == slug).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
    jobs = job_query(db).filter(Job.companyId == company.id, Job.status == "open").order_by(Job.createdAt.desc()).all()
    return {"company": company_json(company), "jobs": [job_json(job) for job in jobs]}


def recommend(db: Session, user: User) -> list[Job]:
    profile = load_profile(db, user.id)
    skills = [skill.name.lower() for skill in profile.skills if len(skill.name) > 1]
    places = [part.strip().lower() for part in profile.preferredLocations.split(",") if part.strip()]
    words = [word for word in re.split(r"[^a-z0-9+]+", f"{profile.headline} {profile.resumeHeadline}".lower()) if len(word) > 3]
    jobs = job_query(db).filter(Job.status == "open").all()
    scored = []
    for job in jobs:
        blob = f"{job.title} {job.description} {job.requirements} {job.category}".lower()
        score = 2 if job.featured else 0
        score += sum(4 for skill in skills if skill in blob)
        if any(place in job.location.lower() for place in places):
            score += 3
        if any(word in job.title.lower() for word in words):
            score += 2
        scored.append((score, job.createdAt, job))
    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [job for _, _, job in scored[:6]]


@app.get("/me/home")
def seeker_home(user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    profile = load_profile(db, user.id)
    applications = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(Job.company))
        .filter(Application.userId == user.id)
        .order_by(Application.createdAt.desc())
        .all()
    )
    saved = (
        db.query(SavedJob)
        .options(joinedload(SavedJob.job).joinedload(Job.company))
        .filter(SavedJob.userId == user.id)
        .order_by(SavedJob.createdAt.desc())
        .all()
    )
    return {
        "profile": profile_json(profile),
        "applications": [
            {
                "id": item.id,
                "status": item.status,
                "note": item.note,
                "createdAt": item.createdAt,
                "job": job_json(item.job),
            }
            for item in applications
        ],
        "saved": [{"jobId": item.jobId, "createdAt": item.createdAt, "job": job_json(item.job)} for item in saved],
        "recommended": [job_json(job) for job in recommend(db, user)],
    }


@app.get("/me/profile")
def my_profile(user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    return profile_json(load_profile(db, user.id))


@app.get("/me/desk")
def desk(user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    home = seeker_home(user, db)
    alerts = db.query(JobAlert).filter(JobAlert.userId == user.id).order_by(JobAlert.createdAt.desc()).all()
    home["alerts"] = [
        {
            "id": alert.id,
            "keyword": alert.keyword,
            "location": alert.location,
            "category": alert.category,
            "createdAt": alert.createdAt,
            "jobs": [job_json(job) for job in match_alert(db, alert)],
        }
        for alert in alerts
    ]
    return home


def match_alert(db: Session, alert: JobAlert) -> list[Job]:
    query = job_query(db).filter(Job.status == "open")
    if alert.keyword:
        like = f"%{alert.keyword}%"
        query = query.filter(or_(Job.title.ilike(like), Job.category.ilike(like), Job.description.ilike(like)))
    if alert.location:
        query = query.filter(Job.location.ilike(f"%{alert.location}%"))
    if alert.category:
        query = query.filter(Job.category == alert.category)
    return query.order_by(Job.createdAt.desc()).limit(6).all()


@app.post("/jobs/{slug}/apply")
def apply(slug: str, body: ApplyBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    note = body.note.strip()
    if len(note) < 20:
        raise HTTPException(status_code=400, detail="Write at least a couple of sentences.")
    if len(note) > 2000:
        raise HTTPException(status_code=400, detail="Keep the note under 2,000 characters.")
    job = db.query(Job).filter(Job.slug == slug, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    profile = load_profile(db, user.id)
    if len(digits(profile.phone)) < 10:
        raise HTTPException(status_code=400, detail="Add your phone number on your profile. The company receives it with your resume.")
    db.add(
        Application(
            id=new_id(),
            jobId=job.id,
            userId=user.id,
            note=note,
            resumeJson=build_resume(profile),
            status="submitted",
            createdAt=now_ms(),
        )
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You already applied to this role.")
    return {"ok": True}


@app.post("/jobs/{slug}/save")
def save_job(slug: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.slug == slug, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    existing = db.get(SavedJob, (user.id, job.id))
    if not existing:
        db.add(SavedJob(userId=user.id, jobId=job.id, createdAt=now_ms()))
        db.commit()
    return {"ok": True}


@app.delete("/jobs/{slug}/save")
def unsave_job(slug: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.slug == slug).first()
    if job:
        saved = db.get(SavedJob, (user.id, job.id))
        if saved:
            db.delete(saved)
            db.commit()
    return {"ok": True}


@app.post("/me/alerts")
def create_alert(body: AlertBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    keyword = body.keyword.strip()
    if len(keyword) < 2:
        raise HTTPException(status_code=400, detail="An alert needs a keyword, like Design or Backend.")
    if body.category and body.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Pick a category from the list.")
    count = db.query(func.count(JobAlert.id)).filter(JobAlert.userId == user.id).scalar() or 0
    if count >= 8:
        raise HTTPException(status_code=400, detail="You can keep up to 8 alerts. Remove one to add another.")
    db.add(
        JobAlert(
            id=new_id(),
            userId=user.id,
            keyword=keyword[:80],
            location=body.location.strip()[:60],
            category=body.category,
            createdAt=now_ms(),
        )
    )
    db.commit()
    return {"ok": True}


@app.delete("/me/alerts/{alert_id}")
def delete_alert(alert_id: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    alert = db.query(JobAlert).filter(JobAlert.id == alert_id, JobAlert.userId == user.id).first()
    if alert:
        db.delete(alert)
        db.commit()
    return {"ok": True}


def patch_profile(user: User, values: dict):
    for key, value in values.items():
        setattr(user, key, value)


@app.patch("/me/profile/basic")
def update_basic(body: BasicBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    if len(body.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name is required.")
    if body.experienceYears is not None and (body.experienceYears < 0 or body.experienceYears > 50):
        raise HTTPException(status_code=400, detail="Experience should be a whole number of years, or left blank.")
    target = load_profile(db, user.id)
    patch_profile(
        target,
        {
            "name": body.name.strip()[:80],
            "headline": body.headline.strip()[:120],
            "currentCompany": body.currentCompany.strip()[:80],
            "location": body.location.strip()[:80],
            "phone": body.phone.strip()[:30],
            "experienceYears": body.experienceYears,
            "resumeHeadline": body.resumeHeadline.strip()[:160],
            "bio": body.bio.strip()[:2000],
        },
    )
    db.commit()
    return {"ok": True}


@app.patch("/me/profile/career")
def update_career(body: CareerBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    for amount in (body.currentCtc, body.expectedCtc):
        if amount is not None and (amount < 0 or amount > 100_000_000):
            raise HTTPException(status_code=400, detail="Salary should be a whole number of rupees per year, or left blank.")
    if body.noticePeriod and body.noticePeriod not in NOTICE:
        raise HTTPException(status_code=400, detail="Pick a notice period from the list.")
    if body.preferredType and body.preferredType not in JOB_TYPES:
        raise HTTPException(status_code=400, detail="Pick a job type from the list.")
    target = load_profile(db, user.id)
    patch_profile(
        target,
        {
            "currentCtc": body.currentCtc,
            "expectedCtc": body.expectedCtc,
            "noticePeriod": body.noticePeriod,
            "preferredLocations": body.preferredLocations.strip()[:120],
            "preferredType": body.preferredType,
            "industry": body.industry.strip()[:80],
            "department": body.department.strip()[:80],
        },
    )
    db.commit()
    return {"ok": True}


@app.patch("/me/profile/personal")
def update_personal(body: PersonalBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    if body.gender and body.gender not in GENDERS:
        raise HTTPException(status_code=400, detail="Pick a gender option from the list.")
    target = load_profile(db, user.id)
    patch_profile(
        target,
        {
            "dateOfBirth": body.dateOfBirth.strip()[:20],
            "gender": body.gender,
            "languages": body.languages.strip()[:120],
        },
    )
    db.commit()
    return {"ok": True}


@app.post("/me/skills")
def add_skill(body: SkillBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    name = re.sub(r"\s+", " ", body.name).strip()
    if len(name) < 2 or len(name) > 40:
        raise HTTPException(status_code=400, detail="A skill should be 2–40 characters.")
    count = db.query(func.count(Skill.id)).filter(Skill.userId == user.id).scalar() or 0
    if count >= 20:
        raise HTTPException(status_code=400, detail="You can list up to 20 skills.")
    db.add(Skill(id=new_id(), userId=user.id, name=name, nameKey=name.lower()))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That skill is already on your profile.")
    return {"ok": True}


@app.delete("/me/skills/{skill_id}")
def remove_skill(skill_id: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.userId == user.id).first()
    if skill:
        db.delete(skill)
        db.commit()
    return {"ok": True}


@app.post("/me/employment")
def save_employment(body: EmploymentBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    if len(body.designation.strip()) < 2 or len(body.company.strip()) < 2:
        raise HTTPException(status_code=400, detail="Add the job title and company.")
    if not 1 <= body.startMonth <= 12 or body.startYear < 1970:
        raise HTTPException(status_code=400, detail="Add the month and year you started.")
    if not body.current and (body.endMonth is None or body.endYear is None):
        raise HTTPException(status_code=400, detail="Add an end date, or mark this as your current job.")
    values = {
        "designation": body.designation.strip()[:80],
        "company": body.company.strip()[:80],
        "location": body.location.strip()[:80],
        "startMonth": body.startMonth,
        "startYear": body.startYear,
        "endMonth": None if body.current else body.endMonth,
        "endYear": None if body.current else body.endYear,
        "current": body.current,
        "description": body.description.strip()[:1000],
    }
    if body.id:
        existing = db.query(Employment).filter(Employment.id == body.id, Employment.userId == user.id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Employment not found.")
        patch_profile(existing, values)
    else:
        count = db.query(func.count(Employment.id)).filter(Employment.userId == user.id).scalar() or 0
        if count >= 12:
            raise HTTPException(status_code=400, detail="You can add up to 12 jobs.")
        db.add(Employment(id=new_id(), userId=user.id, **values))
    db.commit()
    return {"ok": True}


@app.delete("/me/employment/{item_id}")
def delete_employment(item_id: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    item = db.query(Employment).filter(Employment.id == item_id, Employment.userId == user.id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}


@app.post("/me/education")
def save_education(body: EducationBody, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    if len(body.degree.strip()) < 2 or len(body.institute.strip()) < 2:
        raise HTTPException(status_code=400, detail="Add the degree and the institute.")
    values = {
        "degree": body.degree.strip()[:80],
        "specialization": body.specialization.strip()[:80],
        "institute": body.institute.strip()[:120],
        "endYear": body.endYear,
        "score": body.score.strip()[:40],
    }
    if body.id:
        existing = db.query(Education).filter(Education.id == body.id, Education.userId == user.id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Education not found.")
        patch_profile(existing, values)
    else:
        count = db.query(func.count(Education.id)).filter(Education.userId == user.id).scalar() or 0
        if count >= 8:
            raise HTTPException(status_code=400, detail="You can add up to 8 qualifications.")
        db.add(Education(id=new_id(), userId=user.id, **values))
    db.commit()
    return {"ok": True}


@app.delete("/me/education/{item_id}")
def delete_education(item_id: str, user: User = Depends(require_seeker), db: Session = Depends(get_db)):
    item = db.query(Education).filter(Education.id == item_id, Education.userId == user.id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}


def assert_can_post(db: Session, company_id: str):
    company = db.get(Company, company_id)
    if not company or not company.approved:
        raise HTTPException(status_code=403, detail="The main admin has not given this company access to post jobs.")
    return company


def phone_ok(phone: str) -> bool:
    return len(digits(phone)) >= 10


@app.get("/hire")
def hire_home(user: User = Depends(require_employer), db: Session = Depends(get_db)):
    company = db.get(Company, user.companyId)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
    jobs = db.query(Job).filter(Job.companyId == company.id).order_by(Job.createdAt.desc()).all()
    counts = dict(
        db.query(Application.jobId, func.count(Application.id)).filter(Application.jobId.in_([job.id for job in jobs] or [""])).group_by(Application.jobId).all()
    ) if jobs else {}
    payload = []
    for job in jobs:
        job.company = company
        item = job_json(job, applications=counts.get(job.id, 0))
        payload.append(item)
    return {"company": company_json(company), "jobs": payload}


@app.patch("/hire/company")
def update_company(body: CompanyBody, user: User = Depends(require_employer), db: Session = Depends(get_db)):
    if len(body.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Company name is required.")
    if body.size and body.size not in SIZES:
        raise HTTPException(status_code=400, detail="Pick a team size.")
    if len(body.hrName.strip()) < 2 or not phone_ok(body.hrPhone):
        raise HTTPException(status_code=400, detail="Add the HR name and a phone number candidates can call.")
    company = db.get(Company, user.companyId)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
    company.name = body.name.strip()[:80]
    company.location = body.location.strip()[:80]
    company.size = body.size
    company.about = body.about.strip()[:800]
    company.website = clean_website(body.website.strip())
    company.hrName = body.hrName.strip()[:80]
    company.hrPhone = body.hrPhone.strip()[:24]
    company.hrEmail = body.hrEmail.strip().lower()[:120]
    db.commit()
    return {"ok": True}


def job_values(body: JobBody) -> dict:
    if body.workplace not in WORKPLACES or body.type not in JOB_TYPES or body.experience not in EXPERIENCE or body.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Check the form.")
    if len(body.title.strip()) < 4 or len(body.location.strip()) < 2:
        raise HTTPException(status_code=400, detail="Add a clear job title and a city.")
    if len(body.description.strip()) < 40 or len(body.requirements.strip()) < 4:
        raise HTTPException(status_code=400, detail="Describe the role and add at least one requirement.")
    if len(body.hrName.strip()) < 2 or not phone_ok(body.hrPhone):
        raise HTTPException(status_code=400, detail="Add the HR name candidates will see.")
    if body.salaryMin is not None and body.salaryMax is not None and body.salaryMin > body.salaryMax:
        raise HTTPException(status_code=400, detail="Minimum salary can't be higher than the maximum.")
    return {
        "title": body.title.strip()[:100],
        "location": body.location.strip()[:80],
        "workplace": body.workplace,
        "type": body.type,
        "experience": body.experience,
        "category": body.category,
        "description": body.description.strip()[:5000],
        "requirements": body.requirements.strip()[:3000],
        "salaryMin": body.salaryMin,
        "salaryMax": body.salaryMax,
        "hrName": body.hrName.strip()[:80],
        "hrPhone": body.hrPhone.strip()[:24],
        "hrEmail": body.hrEmail.strip().lower()[:120],
    }


@app.post("/hire/jobs")
def create_job(body: JobBody, user: User = Depends(require_employer), db: Session = Depends(get_db)):
    assert_can_post(db, user.companyId or "")
    values = job_values(body)
    job = Job(
        id=new_id(),
        slug=f"{slugify(values['title'])}-{secrets.token_hex(2)}",
        companyId=user.companyId,
        status="open",
        currency="INR",
        createdAt=now_ms(),
        **values,
    )
    db.add(job)
    db.commit()
    return {"id": job.id, "slug": job.slug}


@app.patch("/hire/jobs/{job_id}")
def update_job(job_id: str, body: JobBody, user: User = Depends(require_employer), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.companyId == user.companyId).first()
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    assert_can_post(db, user.companyId or "")
    values = job_values(body)
    if body.status in {"open", "closed"}:
        values["status"] = body.status
    patch_profile(job, values)
    db.commit()
    return {"slug": job.slug}


@app.get("/hire/jobs/{job_id}")
def employer_job(job_id: str, user: User = Depends(require_employer), db: Session = Depends(get_db)):
    job = job_query(db).filter(Job.id == job_id, Job.companyId == user.companyId).first()
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    applications = (
        db.query(Application)
        .options(selectinload(Application.user).selectinload(User.skills), selectinload(Application.user).selectinload(User.employments), selectinload(Application.user).selectinload(User.educations))
        .filter(Application.jobId == job.id)
        .order_by(Application.createdAt.desc())
        .all()
    )
    payload = job_json(job)
    payload["applications"] = [
        {
            "id": item.id,
            "note": item.note,
            "resumeJson": item.resumeJson,
            "status": item.status,
            "createdAt": item.createdAt,
            "user": profile_json(item.user),
        }
        for item in applications
    ]
    return payload


@app.patch("/hire/applications/{application_id}")
def set_status(application_id: str, body: StatusBody, user: User = Depends(require_employer), db: Session = Depends(get_db)):
    if body.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Pick a status.")
    application = (
        db.query(Application)
        .join(Job)
        .filter(Application.id == application_id, Job.companyId == user.companyId)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    application.status = body.status
    db.commit()
    return {"jobId": application.jobId}


@app.get("/admin/board")
def admin_board(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    jobs = job_query(db).order_by(Job.createdAt.desc()).all()
    counts = dict(db.query(Application.jobId, func.count(Application.id)).group_by(Application.jobId).all())
    companies = db.query(Company).options(selectinload(Company.users), selectinload(Company.jobs)).order_by(Company.name.asc()).all()
    return {
        "openRoles": db.query(func.count(Job.id)).filter(Job.status == "open").scalar() or 0,
        "seekers": db.query(func.count(User.id)).filter(User.role == "seeker").scalar() or 0,
        "applications": db.query(func.count(Application.id)).scalar() or 0,
        "jobs": [job_json(job, applications=counts.get(job.id, 0)) for job in jobs],
        "companies": [
            {
                **company_json(company),
                "users": [{"name": person.name, "email": person.email} for person in company.users if person.role == "employer"],
                "_count": {"jobs": len(company.jobs)},
            }
            for company in companies
        ],
    }


@app.patch("/admin/companies/{company_id}")
def set_access(company_id: str, body: AccessBody, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
    company.approved = body.approved
    db.commit()
    return {"name": company.name, "approved": bool(company.approved)}


@app.patch("/admin/jobs/{job_id}")
def set_flags(job_id: str, body: FlagsBody, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Role not found.")
    if body.status in {"open", "closed"}:
        job.status = body.status
    if body.featured is not None:
        job.featured = body.featured
    db.commit()
    return {"slug": job.slug}
