import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = os.getenv("APP_NAME", "HostelGuard AI")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hostelguard.db")
    
    # WhatsApp Provider Selection: "META", "TWILIO", "CALLMEBOT", or "AUTO"
    WHATSAPP_PROVIDER: str = os.getenv("WHATSAPP_PROVIDER", "AUTO")
    
    # 1. Meta WhatsApp Business Cloud API
    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
    
    # 2. Twilio WhatsApp API
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_FROM: str = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    
    # 3. CallMeBot Free Direct WhatsApp API (Instant setup)
    CALLMEBOT_API_KEY: str = os.getenv("CALLMEBOT_API_KEY", "")
    
    # Target Warden Phone Number
    WARDEN_PHONE_NUMBER: str = os.getenv("WARDEN_PHONE_NUMBER", "+917843006100")
    
    # Android SMS Gateway Configuration
    SMS_ENABLED: bool = os.getenv("SMS_ENABLED", "True").lower() in ("true", "1", "yes")
    SMS_GATEWAY_URL: str = os.getenv("SMS_GATEWAY_URL", "http://192.168.1.100:8080")
    SMS_GATEWAY_API_KEY: str = os.getenv("SMS_GATEWAY_API_KEY", "hostelguard_sms_gateway_secret_2026")
    SMS_GATEWAY_TIMEOUT_SECONDS: float = float(os.getenv("SMS_GATEWAY_TIMEOUT_SECONDS", "5.0"))
    
    # AI Thresholds
    DEFAULT_CROWD_THRESHOLD: int = int(os.getenv("DEFAULT_CROWD_THRESHOLD", "8"))
    FALL_CONFIDENCE_THRESHOLD: float = float(os.getenv("FALL_CONFIDENCE_THRESHOLD", "0.80"))
    FALL_DURATION_THRESHOLD_SECONDS: float = float(os.getenv("FALL_DURATION_THRESHOLD_SECONDS", "3.0"))
    COOLDOWN_SUPPRESSION_SECONDS: int = int(os.getenv("COOLDOWN_SUPPRESSION_SECONDS", "60"))
    
    # Demo Notification Mode (Set to False when credentials configured)
    DEMO_NOTIFICATION_MODE: bool = os.getenv("DEMO_NOTIFICATION_MODE", "False").lower() in ("true", "1", "yes")

    # Directory Paths
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    SNAPSHOT_DIR: str = os.path.join(BASE_DIR, "uploads", "snapshots")
    SAMPLE_VIDEOS_DIR: str = os.path.join(BASE_DIR, "uploads", "sample_videos")

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SNAPSHOT_DIR, exist_ok=True)
os.makedirs(settings.SAMPLE_VIDEOS_DIR, exist_ok=True)
