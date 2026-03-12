"""Generate Police Verification form as PDF, based on tenant and owner."""
from pathlib import Path
from typing import Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.owner import OwnerResponse
from app.models.tenant import TenantResponse
from app.models.police_verification import PoliceVerificationResponse
from app.repositories.owner_repository import OwnerRepository
from app.repositories.tenant_repository import TenantRepository
from app.repositories.police_verification_repository import PoliceVerificationRepository


class PoliceVerificationDocumentService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._owners = OwnerRepository(db)
        self._tenants = TenantRepository(db)
        self._verifications = PoliceVerificationRepository(db)

    async def _get_context(self, verification_id: str) -> tuple[PoliceVerificationResponse, TenantResponse, OwnerResponse]:
        verification = await self._verifications.get_by_id(verification_id)
        if not verification:
            raise HTTPException(status_code=404, detail="Police verification not found")
        tenant = await self._tenants.get_by_id(verification.tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found for verification")
        if not tenant.owner_id:
            raise HTTPException(status_code=400, detail="Tenant is not linked to any owner")
        owner = await self._owners.get_by_id(tenant.owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found for tenant")
        # Defensive: repositories may return dicts or Pydantic models
        if isinstance(verification, dict):
            verification = PoliceVerificationResponse(**verification)
        if isinstance(tenant, dict):
            tenant = TenantResponse(**tenant)
        if isinstance(owner, dict):
            owner = OwnerResponse(**owner)
        return verification, tenant, owner

    async def to_pdf_bytes(self, verification_id: str) -> bytes:
        """Generate A4 PDF mirroring the police verification form layout."""
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import mm

        verification, tenant, owner = await self._get_context(verification_id)

        buffer = __import__("io").BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]
        normal.fontName = "Times-Roman"
        normal.fontSize = 10
        normal.leading = 12

        title_style = ParagraphStyle(
            name="Title",
            parent=normal,
            fontName="Times-Bold",
            fontSize=12,
            alignment=1,
            spaceAfter=4,
        )
        sub_title_style = ParagraphStyle(
            name="SubTitle",
            parent=normal,
            fontName="Times-Roman",
            fontSize=10,
            alignment=1,
            spaceAfter=8,
        )
        cell_bold = ParagraphStyle(
            name="CellBold",
            parent=normal,
            fontName="Times-Bold",
        )

        story = []

        # Header - bilingual title (simplified)
        story.append(Paragraph("मालकांकडून घर / जागा / फ्लॅट भाड्याने देताना देण्यात येणारी माहिती", title_style))
        story.append(Paragraph("Information to be given by owner while renting out property (Police Verification)", sub_title_style))

        # Photos row (3 columns)
        photo_box = Paragraph("Photo", normal)
        photo_table = Table(
            [
                [photo_box, photo_box, photo_box],
                [
                    Paragraph("House / Flat / Plot Owner", normal),
                    Paragraph("Agent / Mediator", normal),
                    Paragraph("Tenant", normal),
                ],
            ],
            colWidths=[50 * mm, 50 * mm, 50 * mm],
        )
        photo_table.setStyle(
            TableStyle(
                [
                    ("BOX", (0, 0), (-1, 0), 0.75, colors.black),
                    ("BOX", (0, 1), (-1, 1), 0.75, colors.black),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
                ]
            )
        )
        story.append(photo_table)
        story.append(Spacer(1, 6))

        # Helper to build multiline cells
        def lines(*parts: str) -> str:
            return "<br/>".join([p for p in parts if p])

        owner_addr = owner.property_address or ""
        tenant_local_addr = tenant.residential_address or ""
        tenant_perm_addr = tenant.residential_address or ""
        tenant_office_addr = tenant.office_address or ""

        owner_block = Paragraph(
            lines(
                f"Name: {owner.name}",
                f"Mobile Number: {owner.phone}",
                f"Address: {owner_addr}",
            ),
            normal,
        )

        poa = owner.poa
        agent_block = Paragraph(
            lines(
                f"Name: {poa.name}" if poa and poa.name else "Name: ____________",
                f"Mobile Number: {poa.phone}" if poa and poa.phone else "Mobile Number: ____________",
            ),
            normal,
        )

        tenant_block_basic = Paragraph(
            lines(
                f"Name: {tenant.tenant_name or ''}",
                f"Mobile Number: {tenant.contact_number or ''}",
                f"Address: {tenant_local_addr}",
            ),
            normal,
        )

        # Main information table (4 columns: Sr, Question, Owner/Agent, Tenant)
        data = []

        def add_row(num: str, question: str, owner_cell, tenant_cell):
            data.append(
                [
                    Paragraph(num, normal),
                    Paragraph(question, normal),
                    owner_cell,
                    tenant_cell,
                ]
            )

        # 1. Names & basic contact
        add_row(
            "1",
            "Owner's / Agent's / Tenant's Name, Age, detailed Address with Telephone / Mobile Number",
            owner_block,
            tenant_block_basic,
        )

        # 2. Property to be rented out
        add_row(
            "2",
            "Details Address of the Flat / Plot / House to be Rent Out",
            Paragraph(f"Address: {owner_addr}", normal),
            Paragraph(f"Address: {tenant_local_addr}", normal),
        )

        # 3. Use of accommodation
        add_row(
            "3",
            "Use of accommodation – Residential / Commercial / other purpose, Specify",
            Paragraph("Residential", cell_bold),
            Paragraph("", normal),
        )

        # 4. Tenant previous address (using permanent / previous if distinct)
        add_row(
            "4",
            "Tenant's Name, Age & details Previous Address with Telephone / Mobile No.",
            Paragraph("", normal),
            Paragraph(
                lines(
                    f"Name: {tenant.tenant_name or ''}",
                    f"Mobile Number: {tenant.contact_number or ''}",
                    f"Previous Address: {tenant_perm_addr}",
                ),
                normal,
            ),
        )

        # 5. Tenant permanent residential address
        add_row(
            "5",
            "Tenant's Permanent Residential Address with Telephone / Mobile",
            Paragraph("", normal),
            Paragraph(tenant_perm_addr or "____________________", normal),
        )

        # 6. Tenant office details
        add_row(
            "6",
            "Tenant's Office / Institute Address with Telephone / Mobile Number",
            Paragraph("", normal),
            Paragraph(
                lines(
                    f"Office Name: {tenant.institute_office_name or ''}",
                    f"Office Address: {tenant_office_addr}",
                ),
                normal,
            ),
        )

        # 7. Agent / Mediator
        add_row(
            "7",
            "Name of Agent / Mediator, Age, details Address with Telephone / Mobile No.",
            agent_block,
            Paragraph("", normal),
        )

        table = Table(
            data,
            colWidths=[10 * mm, 60 * mm, 55 * mm, 55 * mm],
            repeatRows=0,
        )
        table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 8))

        # Signature area
        sig_table = Table(
            [
                [
                    Paragraph("Owner's Name, Signature with Date", normal),
                    Paragraph("Tenant's Name, Signature with Date", normal),
                ]
            ],
            colWidths=[90 * mm, 90 * mm],
        )
        sig_table.setStyle(
            TableStyle(
                [
                    ("TOPPADDING", (0, 0), (-1, -1), 18),
                ]
            )
        )
        story.append(sig_table)

        # Footer note
        note_style = ParagraphStyle(
            name="Note",
            parent=normal,
            fontSize=8,
            leading=10,
        )
        story.append(Spacer(1, 6))
        story.append(
            Paragraph(
                "Owner & Tenant should attach Xerox copy of their Photo Identity (Aadhaar Card or PAN Card or Driving License or any other Photo Identity).",
                note_style,
            )
        )

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

