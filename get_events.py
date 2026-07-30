
from app.models.service_models import ServiceEvent
from app.schemas.service_schemas import ServiceEventRead
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

engine = create_engine("postgresql://postgres:91Vcn%25vq@dbagss-dev.ccboaaw4o86h.us-east-1.rds.amazonaws.com:5432/arregui_hub")
Session = sessionmaker(bind=engine)
session = Session()

events = session.query(ServiceEvent).all()
res = [ServiceEventRead.model_validate(e).model_dump(mode="json") for e in events]
print(json.dumps(res))
        