# EstateCommand - Property Management System PRD

## Original Problem Statement
Build a production-ready property management web application for a broker managing rental flats with:
- JWT-based authentication
- Admin Dashboard with stats
- Tenant Management (CRUD)
- Owner Management (CRUD)
- Agreements Management
- Police Verification with file uploads
- Owner Payment Tracking
- Expenses Management
- Leave Notices

## User Choices
- Authentication: JWT-based custom auth
- File Storage: MongoDB (Base64 encoded)
- Theme: Light theme with modern colors
- Database: Default MongoDB from environment

## Architecture
- **Frontend**: React 19 with React Router, Axios, Shadcn/UI components, Tailwind CSS
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Database**: MongoDB with collections for admins, owners, tenants, notices, agreements, police_verifications, payments, expenses
- **Auth**: JWT tokens with bcrypt password hashing

## Core Requirements (Static)
1. Single admin system (no multi-role)
2. CRUD operations for all entities
3. Proper entity relationships (tenant-owner, agreement-tenant-owner)
4. Dashboard stats with real-time counts
5. Monthly payment and expense tracking
6. Document upload for police verification (Base64 in MongoDB)

## User Personas
- **Primary**: Property broker/admin managing rental flats
- **Actions**: Add tenants/owners, track agreements, manage payments, handle leave notices

## What's Been Implemented (February 2026)

### Backend (FastAPI)
- [x] JWT Authentication (register, login, token verification)
- [x] Owner CRUD endpoints (/api/owners)
- [x] Tenant CRUD endpoints (/api/tenants)
- [x] Agreement CRUD endpoints (/api/agreements)
- [x] Police Verification endpoints (/api/police-verifications)
- [x] Payment endpoints (/api/payments) with monthly filtering
- [x] Expense endpoints (/api/expenses) with monthly filtering
- [x] Notice endpoints (/api/notices)
- [x] Dashboard stats endpoint (/api/dashboard/stats)

### Frontend (React)
- [x] Login/Register page with toggle
- [x] Admin Layout with sidebar navigation
- [x] Dashboard with 6 stat cards and recent items
- [x] Owners page with CRUD, search, pagination
- [x] Tenants page with CRUD, owner selection, search
- [x] Agreements page with status badges
- [x] Police Verification page with file upload UI
- [x] Payments page with month/owner filters
- [x] Expenses page with expense type badges
- [x] Leave Notices page with days remaining calculation

## Prioritized Backlog

### P0 (Complete)
- [x] Authentication system
- [x] All CRUD operations
- [x] Dashboard stats
- [x] Entity relationships

### P1 (Future Enhancement)
- [ ] JWT token refresh mechanism
- [ ] Bulk data export (CSV/Excel)
- [ ] Email notifications for notices

### P2 (Nice to Have)
- [ ] Multi-admin support
- [ ] Tenant portal
- [ ] Mobile app

## Next Tasks
1. Add JWT token refresh to reduce session timeouts
2. Implement data export functionality
3. Add email notifications for leave notices approaching date
