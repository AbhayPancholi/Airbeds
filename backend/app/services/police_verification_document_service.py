"""Generate Police Verification form as PDF, matching the official Marathi/English template."""

from typing import Optional
import io
import base64
import os

from fastapi import HTTPException

# Font name used for the whole document when Devanagari TTF is registered (Marathi + English).
DEVANAGARI_FONT_NAME = "DevanagariPDF"


def _register_devanagari_font() -> str:
    """Register a Devanagari-capable TTF so Marathi renders instead of black boxes. Returns font name."""
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
    except ImportError:
        return "Times-Roman"
    this_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.dirname(this_dir)
    candidates = [
        os.path.join(this_dir, "fonts", "NotoSansDevanagari-Regular.ttf"),
        os.path.join(this_dir, "fonts", "NotoSerifDevanagari-Regular.ttf"),
        os.path.join(this_dir, "fonts", "Mangal.ttf"),
        os.path.join(app_dir, "fonts", "NotoSansDevanagari-Regular.ttf"),
        os.path.join(app_dir, "fonts", "Mangal.ttf"),
        r"C:\Windows\Fonts\mangal.ttf",
        r"C:\Windows\Fonts\Mangal.ttf",
        r"C:\Windows\Fonts\NirmalaUI.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
        "/usr/share/fonts/truetype/fonts-deva-extra/mangal.ttf",
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            try:
                pdfmetrics.registerFont(TTFont(DEVANAGARI_FONT_NAME, path))
                return DEVANAGARI_FONT_NAME
            except Exception:
                continue
    return "Times-Roman"


from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.owner import OwnerResponse, AddressModel
from app.models.tenant import TenantResponse
from app.models.police_verification import PoliceVerificationResponse
from app.repositories.owner_repository import OwnerRepository
from app.repositories.tenant_repository import TenantRepository
from app.repositories.police_verification_repository import PoliceVerificationRepository


def _addr_str(addr: Optional[AddressModel]) -> str:
    if not addr:
        return ""
    parts = [
        addr.flat_no,
        addr.building_no,
        addr.society,
        addr.block_sector,
        addr.street_landmark,
        addr.city,
        addr.state,
        addr.pin_code,
    ]
    return ", ".join(p for p in parts if p)


def _age_from_dob(dob: Optional[str]) -> str:
    if not dob:
        return ""
    try:
        from datetime import date

        parts = dob.split("-")
        born = date(int(parts[0]), int(parts[1]), int(parts[2]))
        today = date.today()
        age = (
            today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        )
        return f"{age} Years"
    except Exception:
        return ""


class PoliceVerificationDocumentService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._owners = OwnerRepository(db)
        self._tenants = TenantRepository(db)
        self._verifications = PoliceVerificationRepository(db)

    async def _get_context(
        self, verification_id: str
    ) -> tuple[PoliceVerificationResponse, TenantResponse, OwnerResponse]:
        verification = await self._verifications.get_by_id(verification_id)
        if not verification:
            raise HTTPException(status_code=404, detail="Police verification not found")
        tenant = await self._tenants.get_by_id(verification.tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=404, detail="Tenant not found for verification"
            )
        if not tenant.owner_id:
            raise HTTPException(
                status_code=400, detail="Tenant is not linked to any owner"
            )
        owner = await self._owners.get_by_id(tenant.owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found for tenant")
        if isinstance(verification, dict):
            verification = PoliceVerificationResponse(**verification)
        if isinstance(tenant, dict):
            tenant = TenantResponse(**tenant)
        if isinstance(owner, dict):
            owner = OwnerResponse(**owner)
        return verification, tenant, owner

    async def to_pdf_bytes(self, verification_id: str) -> bytes:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            Image as RLImage,
        )
        from reportlab.lib.units import mm

        # Use Devanagari-capable font so Marathi text does not render as black boxes.
        font_name = _register_devanagari_font()

        verification, tenant, owner = await self._get_context(verification_id)
        poa = owner.poa

        buffer = io.BytesIO()
        # Minimal margins so tables use full page width/height
        margin = 8 * mm
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=margin,
            rightMargin=margin,
            topMargin=margin,
            bottomMargin=margin,
        )

        pw = A4[0] - 2 * margin  # full usable page width

        # --- Styles (all use font_name so Marathi + English render correctly) ---
        base = ParagraphStyle(
            "Base",
            fontName=font_name,
            fontSize=9,
            leading=11,
        )
        bold = ParagraphStyle(
            "Bold",
            parent=base,
            fontName=font_name,
        )
        marathi = ParagraphStyle(
            "Marathi",
            parent=base,
            fontName=font_name,
            fontSize=9.5,
            leading=12,
        )
        title_m = ParagraphStyle(
            "TitleM",
            parent=marathi,
            alignment=1,
            fontSize=10,
            leading=13,
        )
        title_e = ParagraphStyle(
            "TitleE",
            parent=bold,
            alignment=1,
            fontSize=10,
            leading=13,
        )
        small = ParagraphStyle(
            "Small",
            parent=base,
            fontSize=7.5,
            leading=9,
        )
        sig_style = ParagraphStyle(
            "Sig",
            parent=base,
            fontSize=8.5,
            leading=10,
            alignment=1,
        )
        center = ParagraphStyle(
            "Center",
            parent=base,
            alignment=1,
        )
        center_bold = ParagraphStyle(
            "CenterBold",
            parent=bold,
            alignment=1,
        )

        story = []

        # ============================================================
        # HEADER — bilingual title in a box
        # ============================================================
        header_data = [
            [
                Paragraph(
                    "मालकांनी घर/जागा/फ्लॅट इ. मालमता भाड्याने देताना द्यावयाची माहिती<br/>"
                    "<b>Information to be given by owner while renting out property viz.</b>",
                    title_m,
                )
            ],
        ]
        header_table = Table(header_data, colWidths=[pw])
        header_table.setStyle(
            TableStyle(
                [
                    ("BOX", (0, 0), (-1, -1), 1, colors.black),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(header_table)
        story.append(Spacer(1, 2 * mm))

        # ============================================================
        # PHOTO ROW — 3 separate photo boxes with gaps between them
        # ============================================================
        photo_box_height_mm = 50
        photo_gap = 16 * mm
        col_photo = (pw - 2 * photo_gap) / 3
        photo_box_width_mm = col_photo / mm  # for image sizing inside cell

        def _photo_cell(
            b64_data: Optional[str], width_mm: float = None, height_mm: float = None
        ):
            w = width_mm if width_mm is not None else min(photo_box_width_mm - 4, 32)
            h = height_mm if height_mm is not None else photo_box_height_mm - 2
            if b64_data and len(b64_data) > 100:
                try:
                    raw = b64_data
                    if raw.startswith("data:"):
                        raw = raw.split(",", 1)[1]
                    img_bytes = base64.b64decode(raw)
                    img_buf = io.BytesIO(img_bytes)
                    return RLImage(img_buf, width=w * mm, height=h * mm)
                except Exception:
                    pass
            return Paragraph("फोटो<br/>Photo", center)

        owner_photo = _photo_cell(getattr(owner, "photo", None))
        tenant_photo = _photo_cell(getattr(tenant, "passport_photo", None))
        agent_photo = Paragraph("फोटो<br/>Photo", center)

        # 5 columns: photo, gap, photo, gap, photo
        photo_data = [
            [owner_photo, "", agent_photo, "", tenant_photo],
            [
                Paragraph("<b>घर/फ्लॅट/प्लॉट मालक</b><br/>House/Flat/Plot Owner", center),
                "",
                Paragraph("<b>एजंट/मध्यस्थ</b><br/>Agent/Mediator", center),
                "",
                Paragraph("<b>भाडेकरू</b><br/>Tenant", center),
            ],
        ]
        photo_table = Table(
            photo_data,
            colWidths=[col_photo, photo_gap, col_photo, photo_gap, col_photo],
            rowHeights=[photo_box_height_mm * mm, None],
        )
        photo_table.setStyle(
            TableStyle(
                [
                    # Box only around each photo cell so they appear as separate boxes
                    ("BOX", (0, 0), (0, 0), 0.75, colors.black),
                    ("BOX", (2, 0), (2, 0), 0.75, colors.black),
                    ("BOX", (4, 0), (4, 0), 0.75, colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
                    ("VALIGN", (0, 1), (-1, 1), "TOP"),
                    ("TOPPADDING", (0, 1), (-1, 1), 2),
                    ("BOTTOMPADDING", (0, 1), (-1, 1), 4),
                ]
            )
        )
        story.append(photo_table)
        story.append(Spacer(1, 2 * mm))

        # ============================================================
        # DATA HELPERS
        # ============================================================
        owner_name = owner.name or ""
        owner_phone = owner.phone or ""
        owner_dob = getattr(owner, "dob", "") or ""
        owner_age = _age_from_dob(owner_dob)

        # Owner address: use structured address if available, else property_address
        owner_addr_str = ""
        if owner.address:
            owner_addr_str = _addr_str(owner.address)
        if not owner_addr_str:
            owner_addr_str = owner.property_address or ""

        # Flat rented out address: first flat address
        flat_addr = ""
        if owner.flats and len(owner.flats) > 0:
            flat_addr = (
                _addr_str(owner.flats[0].address) if owner.flats[0].address else ""
            )
        if not flat_addr:
            flat_addr = owner_addr_str

        tenant_name = tenant.tenant_name or ""
        tenant_age = _age_from_dob(tenant.dob)
        tenant_phone = tenant.contact_number or ""
        tenant_perm_addr = ", ".join(
            p
            for p in [
                tenant.residential_address or "",
                tenant.pin_code or "",
                tenant.state or "",
                tenant.country or "",
            ]
            if p
        )
        tenant_office_name = tenant.institute_office_name or ""
        tenant_office_addr = ", ".join(
            p
            for p in [
                tenant.office_address or "",
                tenant.office_pin_code or "",
                tenant.office_state or "",
                tenant.office_country or "",
            ]
            if p
        )
        tenant_alt_phone = tenant.alternate_contact_number or ""

        poa_name = poa.name if poa and poa.name else ""
        poa_dob = poa.dob if poa else ""
        poa_age = _age_from_dob(poa_dob)
        poa_occupation = poa.occupation if poa else ""
        poa_phone = poa.phone if poa and poa.phone else ""
        poa_email = (poa.email or "") if poa else ""
        poa_addr = _addr_str(poa.address) if poa and poa.address else ""

        def _br(*parts):
            return "<br/>".join(p for p in parts if p)

        # ============================================================
        # MAIN TABLE — 3 columns: Sr | Question (Marathi + English) | Answer
        # Stretched to full page width (proportional)
        # ============================================================
        col_sr = 10 * mm
        col_q = pw * 0.38
        col_ans = pw - col_sr - col_q

        rows = []

        # Row 1: Owner's name, age, address, phone
        rows.append(
            [
                Paragraph("1", center),
                Paragraph(
                    "<b>मालकाचे संपूर्ण नांव, वय,</b><br/>"
                    "<b>संपूर्ण पत्ता व दुरध्वनी/मोबाईल क्रमांक</b><br/><br/>"
                    "Owner's Name, Age, details Address<br/>"
                    "with Telephone / Mobile Number",
                    base,
                ),
                Paragraph(
                    _br(
                        f"<b>Name:</b>  {owner_name}"
                        + (f"  <b>Age:</b> {owner_age}" if owner_age else ""),
                        f"<b>Mobile Number:</b>  {owner_phone}",
                        f"<b>Address:</b> {owner_addr_str}",
                    ),
                    base,
                ),
            ]
        )

        # Row 2: Flat/house to be rented
        rows.append(
            [
                Paragraph("2", center),
                Paragraph(
                    "<b>जागा/फ्लॅट/घर भाड्याने द्यावयाचे आहे त्याचा</b><br/>"
                    "<b>संपूर्ण पत्ता</b><br/><br/>"
                    "Details Address of the Flat/Plot/ House<br/>"
                    "to be Rent Out",
                    base,
                ),
                Paragraph(
                    _br(
                        f"<b>Address:</b> {flat_addr}",
                    ),
                    base,
                ),
            ]
        )

        # Row 3: Use of accommodation
        rows.append(
            [
                Paragraph("3", center),
                Paragraph(
                    "<b>जागेचा वापर,निवास/व्यवसाय/इतर</b><br/>"
                    "<b>कारणासाठी (कारण नमुद करावे)</b><br/><br/>"
                    "Use of accommodation - Residential/<br/>"
                    "Commercial/ other purpose, Specify",
                    base,
                ),
                Paragraph("<b>Residential</b>", bold),
            ]
        )

        # Row 4: Tenant's Name, Age & Previous Address
        rows.append(
            [
                Paragraph("4", center),
                Paragraph(
                    "<b>भाडेकरूचे संपूर्ण नांव, वय व यापूर्वीचा संपूर्ण</b><br/>"
                    "<b>पत्ता दुरध्वनी/मोबाईल क्रमांकासह</b><br/><br/>"
                    "Tenant's Name, Age & details Previous<br/>"
                    "Address with Telephone/Mobile No.",
                    base,
                ),
                Paragraph(
                    _br(
                        f"<b>Name:</b> {tenant_name}",
                        f"<b>Age:</b>  {tenant_age}" if tenant_age else "",
                        f"<b>Mobile Number:</b>  {tenant_phone}",
                    ),
                    base,
                ),
            ]
        )

        # Row 5: Tenant's Permanent Residential Address
        rows.append(
            [
                Paragraph("5", center),
                Paragraph(
                    "<b>भाडेकरूचा कायमस्वरूपी संपूर्ण पत्ता (मूळ</b><br/>"
                    "<b>गांव)</b><br/><br/>"
                    "Tenant's Permanent Residential<br/>"
                    "Address with Telephone/Mobile",
                    base,
                ),
                Paragraph(
                    _br(
                        f"<b>Address:</b> {tenant_perm_addr}",
                    ),
                    base,
                ),
            ]
        )

        # Row 6: Tenant's Office/Institute details
        rows.append(
            [
                Paragraph("6", center),
                Paragraph(
                    "<b>भाड्याने घेणाऱ्या व्यक्तीची नोकरी व्यवसायाचा</b><br/>"
                    "<b>संपूर्ण पत्ता व दुरध्वनी / मोबाईल क्रमांक</b><br/><br/>"
                    "Tenant's Detail Office Address with<br/>"
                    "Telephone / Mobile Number",
                    base,
                ),
                Paragraph(
                    _br(
                        (
                            f"<b>Office Name:</b> {tenant_office_name}"
                            if tenant_office_name
                            else ""
                        ),
                        (
                            f"<b>Address:</b> {tenant_office_addr}"
                            if tenant_office_addr
                            else ""
                        ),
                        f"<b>Mobile Number:</b> {tenant_phone}" if tenant_phone else "",
                    ),
                    base,
                ),
            ]
        )

        # Row 7: Agent / Mediator details
        rows.append(
            [
                Paragraph("7", center),
                Paragraph(
                    "<b>व्यवहारात मध्यस्थ/एजंट असल्यास त्यांचे संपूर्ण नांव,</b><br/>"
                    "<b>वय, संपूर्ण पत्ता व दुरध्वनी / मोबाईल क्रमांक</b><br/><br/>"
                    "Name of Agent/Mediator, Age, detail<br/>"
                    "Address with Telephone/Mobile No.",
                    base,
                ),
                Paragraph(
                    _br(
                        f"<b>Address:</b> {poa_addr}" if poa_addr else "",
                        f"<b>Mobile No:</b> {poa_phone}" if poa_phone else "",
                    ),
                    base,
                ),
            ]
        )

        main_table = Table(rows, colWidths=[col_sr, col_q, col_ans])
        main_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (0, 0), (0, -1), "CENTER"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (1, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (1, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(main_table)
        story.append(Spacer(1, 4 * mm))

        # ============================================================
        # SIGNATURE ROW
        # ============================================================
        owner_sign_img = ""
        if getattr(owner, "sign", None) and len(owner.sign) > 100:
            try:
                raw = owner.sign
                if raw.startswith("data:"):
                    raw = raw.split(",", 1)[1]
                img_bytes = base64.b64decode(raw)
                img_buf = io.BytesIO(img_bytes)
                owner_sign_img = RLImage(img_buf, width=30 * mm, height=12 * mm)
            except Exception:
                owner_sign_img = Spacer(1, 12 * mm)
        else:
            owner_sign_img = Spacer(1, 12 * mm)

        sig_data = [
            [owner_sign_img, Spacer(1, 12 * mm)],
            [
                Paragraph(
                    "<b>मालकाचे नांव, सही व दिनांक</b><br/>"
                    "Owner's Name, Signature with Date",
                    sig_style,
                ),
                Paragraph(
                    "<b>भाडेकऱ्याचे नांव, सही व दिनांक</b><br/>"
                    "Tenant's Name, signature with Date",
                    sig_style,
                ),
            ],
        ]
        sig_table = Table(sig_data, colWidths=[pw / 2, pw / 2])
        sig_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                    ("TOPPADDING", (0, 0), (-1, 0), 6),
                    ("LINEBELOW", (0, 0), (0, 0), 0.5, colors.black),
                    ("LINEBELOW", (1, 0), (1, 0), 0.5, colors.black),
                ]
            )
        )
        story.append(sig_table)
        story.append(Spacer(1, 4 * mm))

        # ============================================================
        # NOTE
        # ============================================================
        note_m = ParagraphStyle("NoteM", parent=base, fontSize=7.5, leading=9)
        note_e = ParagraphStyle("NoteE", parent=bold, fontSize=7.5, leading=9)

        story.append(Paragraph("<b>(Note) टिप :</b>", note_m))
        story.append(
            Paragraph(
                "घरमालक व भाडेकरुंनी त्यांचे फोटो असलेल्या ओळखपत्राची छायांकित प्रत सोबत जोडली.  "
                "(आधारकार्ड किंवा पॅनकार्ड किंवा  ड्रायव्हिंग लायसन्स किंवा <br/>"
                "फोटो असलेले इतर कोणतेही ओळखपत्र).",
                note_m,
            )
        )
        story.append(
            Paragraph(
                "Owner & Tenant should attach Xerox copy of their Photo Identity. "
                "(Aadhar Card or PAN Card or <i>Driving License</i> or any other Photo ID)",
                note_e,
            )
        )

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
