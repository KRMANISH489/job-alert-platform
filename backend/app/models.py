from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Company(Base):
    __tablename__ = "Company"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    website: Mapped[str] = mapped_column(String, default="")
    about: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String, default="")
    size: Mapped[str] = mapped_column(String, default="")
    hrName: Mapped[str] = mapped_column(String, default="")
    hrPhone: Mapped[str] = mapped_column(String, default="")
    hrEmail: Mapped[str] = mapped_column(String, default="")
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[int] = mapped_column(BigInteger, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="company")
    jobs: Mapped[list["Job"]] = relationship(back_populates="company")


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    passwordHash: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    headline: Mapped[str] = mapped_column(String, default="")
    resumeHeadline: Mapped[str] = mapped_column(String, default="")
    location: Mapped[str] = mapped_column(String, default="")
    phone: Mapped[str] = mapped_column(String, default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    experienceYears: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currentCompany: Mapped[str] = mapped_column(String, default="")
    currentCtc: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expectedCtc: Mapped[int | None] = mapped_column(Integer, nullable=True)
    noticePeriod: Mapped[str] = mapped_column(String, default="")
    preferredLocations: Mapped[str] = mapped_column(String, default="")
    preferredType: Mapped[str] = mapped_column(String, default="")
    dateOfBirth: Mapped[str] = mapped_column(String, default="")
    gender: Mapped[str] = mapped_column(String, default="")
    languages: Mapped[str] = mapped_column(String, default="")
    industry: Mapped[str] = mapped_column(String, default="")
    department: Mapped[str] = mapped_column(String, default="")
    companyId: Mapped[str | None] = mapped_column(ForeignKey("Company.id", ondelete="SET NULL"), nullable=True)
    createdAt: Mapped[int] = mapped_column(BigInteger, nullable=False)

    company: Mapped[Company | None] = relationship(back_populates="users")
    skills: Mapped[list["Skill"]] = relationship(back_populates="user")
    employments: Mapped[list["Employment"]] = relationship(back_populates="user")
    educations: Mapped[list["Education"]] = relationship(back_populates="user")
    applications: Mapped[list["Application"]] = relationship(back_populates="user")
    saved_jobs: Mapped[list["SavedJob"]] = relationship(back_populates="user")
    alerts: Mapped[list["JobAlert"]] = relationship(back_populates="user")


class Skill(Base):
    __tablename__ = "Skill"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    nameKey: Mapped[str] = mapped_column(String, nullable=False)
    user: Mapped[User] = relationship(back_populates="skills")


class Employment(Base):
    __tablename__ = "Employment"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    designation: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, default="")
    startMonth: Mapped[int] = mapped_column(Integer, nullable=False)
    startYear: Mapped[int] = mapped_column(Integer, nullable=False)
    endMonth: Mapped[int | None] = mapped_column(Integer, nullable=True)
    endYear: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str] = mapped_column(Text, default="")
    user: Mapped[User] = relationship(back_populates="employments")


class Education(Base):
    __tablename__ = "Education"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    degree: Mapped[str] = mapped_column(String, nullable=False)
    specialization: Mapped[str] = mapped_column(String, default="")
    institute: Mapped[str] = mapped_column(String, nullable=False)
    endYear: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[str] = mapped_column(String, default="")
    user: Mapped[User] = relationship(back_populates="educations")


class Job(Base):
    __tablename__ = "Job"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    companyId: Mapped[str] = mapped_column(ForeignKey("Company.id", ondelete="CASCADE"), nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    workplace: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    experience: Mapped[str] = mapped_column(String, nullable=False)
    salaryMin: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salaryMax: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="INR")
    category: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, default="open")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    hrName: Mapped[str] = mapped_column(String, default="")
    hrPhone: Mapped[str] = mapped_column(String, default="")
    hrEmail: Mapped[str] = mapped_column(String, default="")
    createdAt: Mapped[int] = mapped_column(BigInteger, nullable=False)

    company: Mapped[Company] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(back_populates="job")
    saved_by: Mapped[list["SavedJob"]] = relationship(back_populates="job")


class Application(Base):
    __tablename__ = "Application"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    jobId: Mapped[str] = mapped_column(ForeignKey("Job.id", ondelete="CASCADE"), nullable=False)
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    resumeJson: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String, default="submitted")
    createdAt: Mapped[int] = mapped_column(BigInteger, nullable=False)

    job: Mapped[Job] = relationship(back_populates="applications")
    user: Mapped[User] = relationship(back_populates="applications")


class SavedJob(Base):
    __tablename__ = "SavedJob"

    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"), primary_key=True)
    jobId: Mapped[str] = mapped_column(ForeignKey("Job.id", ondelete="CASCADE"), primary_key=True)
    createdAt: Mapped[int] = mapped_column(BigInteger, nullable=False)

    user: Mapped[User] = relationship(back_populates="saved_jobs")
    job: Mapped[Job] = relationship(back_populates="saved_by")


class JobAlert(Base):
    __tablename__ = "JobAlert"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    userId: Mapped[str] = mapped_column(ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    keyword: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, default="")
    category: Mapped[str] = mapped_column(String, default="")
    createdAt: Mapped[int] = mapped_column(BigInteger, nullable=False)

    user: Mapped[User] = relationship(back_populates="alerts")
