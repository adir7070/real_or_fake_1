from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.deps import get_report_service
from app.schemas.report import ReportRequest
from app.services.report_service import ReportService

router = APIRouter(prefix="/report", tags=["report"])


@router.post("")
async def generate_report(
    payload: ReportRequest,
    service: ReportService = Depends(get_report_service),
) -> StreamingResponse:
    pdf_bytes = service.build_pdf(payload)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="realorfake-report.pdf"'},
    )
