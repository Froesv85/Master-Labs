from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    title: str = ""
    description: str = ""
    content: str = ""


class ClassifyResponse(BaseModel):
    category: str
    categoryConfidence: float
    categorySource: str  # "model" | "heuristic"
    difficulty: str
    difficultyScore: float
    domains: list[str]


class BomItem(BaseModel):
    item: str
    quantity: str = ""
    notes: str = ""


class ValidateBomRequest(BaseModel):
    items: list[BomItem] = Field(default_factory=list)


class MissingSuggestion(BaseModel):
    item: str
    reason: str
    confidence: float


class ValidateBomResponse(BaseModel):
    missingSuggestions: list[MissingSuggestion]
    clusterLabel: str | None = None


class AuditRequest(BaseModel):
    bom: list[BomItem] = Field(default_factory=list)
    technicalRequirementsCount: int = 0
    confidenceScore: float = 0
    groundingCount: int = 0


class AuditResponse(BaseModel):
    auditScore: int
    flags: list[str]


class RetrainResponse(BaseModel):
    categorySamples: int
    bomTransactions: int
