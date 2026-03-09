# Documentación Técnica: BuildAI Platform
## SaaS con IA para Profesionales de la Construcción

**Versión**: 1.0  
**Fecha**: Marzo 2026  
**Estrategia**: Modular, API-First, IA-Native

---

# 1. VISIÓN DEL PRODUCTO

## 1.1 Propuesta de Valor
Plataforma modular SaaS que automatiza tareas técnicas repetitivas en construcción mediante IA, permitiendo a profesionales (arquitectos técnicos, ingenieros, jefes de obra) trabajar 10x más rápido.

## 1.2 Modelo de Producto
**Estrategia**: Productos independientes que se integran en bundles
- Cada módulo funciona standalone
- Datos compartidos entre módulos mediante conectores
- Usuario compra lo que necesita (individual o bundle)

## 1.3 Productos del Portfolio

### Fase 1 (MVP - 3 meses)
1. **CertIA - Certificación Energética con IA**
   - Input automático desde planos/catastro
   - Generación certificado oficial
   - Recomendaciones mejora con ROI

### Fase 2 (Meses 4-9)
2. **MediIA - Mediciones Automáticas**
   - OCR de planos PDF
   - Extracción mediciones desde BIM/IFC
   - Tabla de mediciones estructurada

3. **PrestoIA - Presupuestos Inteligentes**
   - Excel → Presupuesto estructurado
   - Sugerencias de partidas con IA
   - Detección errores y duplicados

### Fase 3 (Meses 10-18)
4. **StructIA - Cálculo Estructural con IA**
   - Predimensionado inteligente
   - Detección errores pre-cálculo
   - Generación variantes estructurales

5. **MEPIA - Instalaciones Automáticas**
   - Generación automática redes (fontanería, electricidad)
   - Optimización energética
   - Detección interferencias

6. **QualityIA - Control de Calidad Digital**
   - OCR certificados ensayos
   - Predicción resultados hormigón
   - Libro de órdenes por voz

---

# 2. ARQUITECTURA TÉCNICA

## 2.1 Vista General (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  API Docs │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│          (Kong / AWS API Gateway / FastAPI)                  │
│   - Auth & Authorization (JWT)                               │
│   - Rate Limiting                                            │
│   - Request Routing                                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   CORE SERVICES  │ │  MODULE SERVICES │ │   AI SERVICES    │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ • Auth Service   │ │ • CertIA Service │ │ • OCR Engine     │
│ • User Service   │ │ • MediIA Service │ │ • NLP Engine     │
│ • Project Mgmt   │ │ • PrestoIA Svc   │ │ • Prediction API │
│ • File Storage   │ │ • StructIA Svc   │ │ • Generative AI  │
│ • Notification   │ │ • MEPIA Service  │ │ • Vision API     │
│ • Billing        │ │ • QualityIA Svc  │ │ • Vector DB      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL   │   MongoDB    │   Redis      │   S3/Blob     │
│  (relational) │   (documents)│   (cache)    │   (files)     │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Principios Arquitectónicos

### 2.2.1 Microservicios Modulares
- **Cada producto = microservicio independiente**
- Comunicación via API REST + Event Bus (RabbitMQ / Kafka)
- Deploy independiente
- Escalado granular

### 2.2.2 API-First Design
- Todas las features accesibles via API
- Permite integraciones con terceros (ERP, BIM software)
- Monetización: API como producto (Enterprise tier)

### 2.2.3 IA-Native
- IA no es add-on, es core del producto
- Modelos propios + APIs externas (OpenAI, Anthropic)
- Pipeline MLOps para entrenar/mejorar modelos

### 2.2.4 Multi-Tenant Architecture
- 1 instancia → N clientes
- Aislamiento de datos por tenant_id
- Optimización costes infraestructura

---

# 3. STACK TECNOLÓGICO

## 3.1 Frontend

### Web Application
```yaml
Framework: React 18+ con TypeScript
State Management: Zustand / Redux Toolkit
UI Library: shadcn/ui + Tailwind CSS
Routing: React Router v6
Forms: React Hook Form + Zod (validación)
API Client: TanStack Query (React Query)
Charts: Recharts / Chart.js
3D Viewer: Three.js (para modelos BIM)
PDF Viewer: React-PDF
Build Tool: Vite
Hosting: Vercel / Cloudflare Pages
```

**Justificación**:
- React: Ecosistema maduro, hiring fácil
- TypeScript: Type safety crítico en app técnica
- shadcn/ui: Componentes modernos, customizables
- TanStack Query: Caché inteligente, menos requests API

### Mobile Application
```yaml
Framework: React Native + Expo
Navigation: React Navigation
State: Zustand (compartir con web)
Camera/OCR: Expo Camera + Vision
Offline: WatermelonDB (sync cuando online)
Maps: MapLibre (si geolocalización)
Build: EAS (Expo Application Services)
```

**Justificación**:
- React Native: Reutilizar código con web (50-70%)
- Expo: Desarrollo rápido, OTA updates
- Crítico para jefes de obra en campo

---

## 3.2 Backend

### Core Services
```yaml
Language: Python 3.11+ (IA/ML) + Node.js/TypeScript (APIs rápidas)
API Framework: 
  - FastAPI (Python) para servicios IA
  - Express/Fastify (Node) para CRUD services
Authentication: 
  - Auth0 / Supabase Auth / Clerk
  - JWT tokens
  - OAuth 2.0 (Google, Microsoft)
API Gateway: Kong / AWS API Gateway
Task Queue: Celery (Python) + Redis / BullMQ (Node)
WebSockets: Socket.io (notificaciones real-time)
Background Jobs: 
  - Celery (procesar PDFs, entrenar modelos)
  - Cron jobs (facturación, emails)
```

**Justificación**:
- Python: Ecosistema IA/ML robusto (TensorFlow, PyTorch, scikit-learn)
- FastAPI: Performance + auto-docs + validación Pydantic
- Node: Para APIs CRUD simples (más rápido desarrollo)

### AI/ML Services
```yaml
OCR: 
  - Tesseract (open source, CAD text)
  - Google Vision API / AWS Textract (backup)
  - PaddleOCR (tablas complejas)
  
NLP:
  - OpenAI GPT-4 / Anthropic Claude (resúmenes, chat)
  - spaCy (NER, clasificación documentos)
  - Sentence Transformers (embeddings)

Computer Vision:
  - YOLO v8 (detección elementos planos: muros, puertas)
  - Detectron2 (segmentación)
  - OpenCV (pre-processing imágenes)

Document Processing:
  - PyPDF2 / pdfplumber (parsing PDFs)
  - python-docx (generar Word)
  - python-pptx (generar PowerPoint)
  - IFCOpenShell (leer modelos BIM)

ML Framework:
  - PyTorch (models custom)
  - Scikit-learn (modelos clásicos)
  - LangChain (orchestration LLMs)
  - Vector DB: Pinecone / Weaviate / Qdrant

MLOps:
  - Weights & Biases (tracking experiments)
  - MLflow (model registry)
  - Docker (containerización modelos)
```

**Justificación**:
- Combinar APIs (OpenAI) con modelos propios (coste vs control)
- YOLO v8: SOTA en detección, open source
- LangChain: Simplifica workflows IA complejos

---

## 3.3 Base de Datos

### Estrategia Multi-Database
```yaml
PostgreSQL (Primary):
  - Users, Projects, Subscriptions
  - Relaciones complejas
  - ACID compliance (facturación)
  - Extensiones: PostGIS (geolocalización)
  
MongoDB:
  - Documentos (certificados, presupuestos)
  - Schemas flexibles
  - Fácil versionado de documentos
  
Redis:
  - Cache (queries frecuentes)
  - Session storage
  - Rate limiting
  - Job queues (Celery backend)
  
S3 / Cloudflare R2:
  - Archivos (PDFs, planos, modelos IFC)
  - Imágenes (renders, fotos obra)
  - Backups DB
  
Vector Database (Pinecone / Qdrant):
  - Embeddings de documentos
  - Búsqueda semántica
  - RAG (Retrieval Augmented Generation)
```

**Justificación**:
- PostgreSQL: Robusto, ACID para billing
- MongoDB: Flexibilidad para docs técnicos (schemas cambiantes)
- Redis: Performance crítico (cache)
- Vector DB: Búsqueda inteligente de proyectos similares

---

## 3.4 Infraestructura & DevOps

### Hosting & Cloud
```yaml
Opción A (AWS):
  - Compute: ECS Fargate (containers sin gestionar servers)
  - DB: RDS (PostgreSQL), DocumentDB (MongoDB)
  - Storage: S3
  - CDN: CloudFront
  - Functions: Lambda (tareas ligeras)
  
Opción B (Multi-Cloud - Recomendado):
  - Compute: Render.com / Railway (staging/small)
  - DB: Supabase (PostgreSQL) / MongoDB Atlas
  - Storage: Cloudflare R2 (más barato que S3)
  - CDN: Cloudflare
  - IA: Modal / Replicate (GPU on-demand)

Opción C (Cost-Optimized Startup):
  - Compute: Fly.io / Railway
  - DB: Supabase (gratis hasta punto)
  - Storage: Cloudflare R2
  - IA: API externa (OpenAI, no self-host)
```

**Recomendación Fase 1**: Opción C (0-1k usuarios)
**Recomendación Fase 2+**: Opción B (1k-10k usuarios)
**Recomendación Scale**: Opción A (10k+ usuarios)

### CI/CD Pipeline
```yaml
Version Control: GitHub / GitLab
CI/CD: GitHub Actions / GitLab CI
Containerización: Docker
Orchestration: Kubernetes (a partir 5k users) o Docker Compose (antes)
Monitoring: 
  - Sentry (error tracking)
  - Datadog / New Relic (APM)
  - Grafana + Prometheus (metrics)
Logging: ELK Stack o Loki
Testing:
  - Unit: Jest (frontend), Pytest (backend)
  - Integration: Playwright / Cypress
  - Load: k6 / Locust
```

### Infrastructure as Code
```yaml
Terraform: Provisionar infra AWS/GCP
Docker Compose: Local development
Kubernetes (Helm): Production (si escala)
```

---

## 3.5 Integraciones Externas

### APIs de Terceros
```yaml
Mapas/Geocoding:
  - Google Maps API (geocoding direcciones)
  - MapBox (visualización mapas)

Catastro:
  - API Catastro España (datos edificios)
  - Sede Electrónica Catastro

Normativas:
  - CTE (Código Técnico Edificación) - scraping
  - Bases de datos precios construcción (BEDEC, etc)

Payment:
  - Stripe (suscripciones, pagos)
  - PayPal (alternativa)

Email:
  - SendGrid / Postmark (transaccional)
  - Mailchimp (marketing)

SMS:
  - Twilio (OTP, notificaciones)

Analytics:
  - PostHog (product analytics)
  - Google Analytics 4 (web)
  - Mixpanel (events)

IA/ML:
  - OpenAI API (GPT-4, Vision)
  - Anthropic Claude API (resúmenes largos)
  - Replicate (modelos custom en GPU)
```

---

# 4. MÓDULOS DEL SISTEMA

## 4.1 Core Platform (Común a Todos)

### 4.1.1 Authentication & Authorization
```python
# Entidades principales
- User (email, password_hash, role, tenant_id)
- Role (name, permissions)
- Tenant (company_name, plan, status)
- Session (user_id, token, expires_at)

# Features
- Multi-tenant (SaaS B2B)
- SSO (Google, Microsoft)
- 2FA (TOTP, SMS)
- RBAC (Role-Based Access Control)
  * Admin, User, Viewer, Guest
```

### 4.1.2 Project Management
```python
# Entidades
- Project (name, type, address, client_id, status)
- ProjectFile (project_id, file_url, type, size)
- ProjectMember (project_id, user_id, role)
- ActivityLog (project_id, user_id, action, timestamp)

# Features
- CRUD proyectos
- Upload/download archivos
- Compartir proyectos con team
- Historial cambios
- Comentarios y notas
```

### 4.1.3 File Management & Storage
```python
# Arquitectura
User uploads file → API → S3/R2 → URL stored in DB → Process async

# Tipos de archivo soportados
- PDFs (planos, memorias)
- DWG/DXF (AutoCAD)
- IFC (BIM)
- Excel/CSV (presupuestos)
- Images (JPG, PNG - fotos obra)

# Features
- Versionado de archivos
- Preview en navegador (PDF, imágenes)
- Conversión formatos (DWG → PDF)
- OCR automático al subir
- Compresión/optimización
```

### 4.1.4 Notifications System
```python
# Canales
- In-app (bell icon)
- Email (transaccional)
- SMS (críticas)
- Push (mobile)

# Tipos de notificaciones
- Sistema (actualizaciones, mantenimiento)
- Proyecto (nuevo comentario, file uploaded)
- Facturación (pago exitoso, fallo)
- IA (proceso completado, error detectado)

# Personalización
- Usuario configura qué recibe y cómo
```

### 4.1.5 Billing & Subscriptions
```python
# Entidades
- Subscription (tenant_id, plan_id, status, period_start, period_end)
- Plan (name, price, features, limits)
- Invoice (subscription_id, amount, status, pdf_url)
- UsageMetrics (tenant_id, metric_type, value, date)

# Planes
- Free (limitado)
- Individual (1 producto)
- Bundle Pro (3-4 productos)
- Enterprise (custom)

# Features
- Cobro automático mensual/anual (Stripe)
- Proration (upgrade/downgrade mid-cycle)
- Usage-based billing (ej: 15€/certificado extra)
- Facturación automática (PDF)
- Dunning (retry failed payments)
```

---

## 4.2 Módulo 1: CertIA (Certificación Energética)

### 4.2.1 Arquitectura del Módulo
```
User uploads plano PDF
         ↓
OCR extraction (Tesseract + GPT-4 Vision)
         ↓
Extract: superficie, orientación, huecos, materiales
         ↓
Query Catastro API (año construcción, ubicación)
         ↓
Generate energy model (Python logic + CTE rules)
         ↓
Calculate energy rating (A-G)
         ↓
IA generates improvement recommendations
         ↓
Generate official certificate PDF
         ↓
Save to DB + send to user
```

### 4.2.2 Entidades de Datos
```python
class Energycertificate(BaseModel):
    id: UUID
    project_id: UUID
    address: str
    cadastral_ref: str
    surface_m2: float
    construction_year: int
    building_type: str  # 'residential', 'commercial'
    
    # Envelope
    walls_u_value: float
    windows_u_value: float
    roof_u_value: float
    floor_u_value: float
    
    # Systems
    heating_system: str
    cooling_system: str
    hot_water_system: str
    
    # Results
    energy_consumption_kwh_m2_year: float
    co2_emissions_kg_m2_year: float
    rating: str  # 'A', 'B', 'C', 'D', 'E', 'F', 'G'
    
    # Improvements
    recommendations: List[Improvement]
    
    # Metadata
    created_at: datetime
    certificate_pdf_url: str
    status: str  # 'draft', 'completed', 'registered'

class Improvement(BaseModel):
    description: str
    investment_eur: float
    savings_eur_year: float
    payback_years: float
    new_rating: str
    priority: int
```

### 4.2.3 Pipeline IA
```python
# 1. OCR + Vision
def extract_building_data(pdf_path: str) -> dict:
    """
    Usa GPT-4 Vision para extraer info de planos
    """
    images = pdf_to_images(pdf_path)
    
    prompt = """
    Analiza este plano arquitectónico y extrae:
    - Superficie útil total (m²)
    - Orientación fachadas
    - Número y dimensiones de ventanas
    - Materiales constructivos (si se indican)
    
    Devuelve JSON estructurado.
    """
    
    response = openai.chat.completions.create(
        model="gpt-4-vision",
        messages=[{"role": "user", "content": prompt, "images": images}]
    )
    
    return json.loads(response.content)

# 2. Catastro integration
def get_cadastral_data(address: str) -> dict:
    """
    Query API Catastro para año construcción, materiales tipo
    """
    # Geocode address
    coords = geocode(address)
    
    # Query Catastro
    response = requests.get(
        "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR",
        params={"SRS": "EPSG:4326", "Coordenada_X": coords.lng, "Coordenada_Y": coords.lat}
    )
    
    return parse_cadastro_xml(response.text)

# 3. Energy calculation
def calculate_energy_rating(building_data: dict) -> tuple[float, str]:
    """
    Cálculo simplificado según CTE DB-HE
    """
    # Transmitancia térmica envolvente
    u_envelope = calculate_u_value(building_data)
    
    # Demanda energética (simplificado)
    heating_demand = calculate_heating_demand(building_data, u_envelope)
    cooling_demand = calculate_cooling_demand(building_data, u_envelope)
    
    # Consumo sistemas
    heating_consumption = heating_demand / building_data['heating_efficiency']
    cooling_consumption = cooling_demand / building_data['cooling_efficiency']
    hot_water_consumption = calculate_hot_water(building_data)
    
    total_consumption = heating_consumption + cooling_consumption + hot_water_consumption
    
    # Rating (según tabla CTE)
    rating = get_rating_from_consumption(total_consumption)
    
    return total_consumption, rating

# 4. IA recommendations
def generate_improvements(current_rating: str, building_data: dict) -> List[Improvement]:
    """
    IA sugiere mejoras para subir rating
    """
    prompt = f"""
    Edificio con rating {current_rating}.
    Datos: {json.dumps(building_data)}
    
    Sugiere 3-5 mejoras energéticas priorizadas:
    1. Cambio ventanas
    2. Aislamiento fachada
    3. Sistema climatización eficiente
    etc.
    
    Para cada una, estima inversión y ahorro anual.
    Devuelve JSON.
    """
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "system", "content": "Eres experto en eficiencia energética"},
                  {"role": "user", "content": prompt}]
    )
    
    improvements = json.loads(response.content)
    
    # Enriquecer con cálculos precisos
    for imp in improvements:
        imp['payback_years'] = imp['investment_eur'] / imp['savings_eur_year']
    
    return improvements
```

### 4.2.4 API Endpoints
```yaml
POST /api/v1/certificates/
  - Create new certificate (upload PDF)
  
GET /api/v1/certificates/{id}
  - Get certificate details
  
PATCH /api/v1/certificates/{id}
  - Update certificate (edit manual data)
  
POST /api/v1/certificates/{id}/calculate
  - Trigger calculation (async)
  
GET /api/v1/certificates/{id}/pdf
  - Download official PDF
  
POST /api/v1/certificates/{id}/improvements
  - Generate improvement recommendations
  
GET /api/v1/certificates/
  - List user's certificates (paginated)
```

---

## 4.3 Módulo 2: MediIA (Mediciones Automáticas)

### 4.3.1 Pipeline Técnico
```
User uploads plano PDF/DWG
         ↓
Convert to images (if PDF) or parse DWG
         ↓
AI detects elements:
  - Walls (by thickness, material layer)
  - Doors/Windows (by symbol recognition)
  - Spaces/Rooms (by enclosed areas)
  - Annotations (dimensions, labels)
         ↓
Calculate quantities:
  - Linear (m): walls, perimeters
  - Area (m²): floors, ceilings, facades
  - Volume (m³): excavation, concrete
         ↓
Match to budget items (partidas)
         ↓
Generate measurement table
         ↓
User reviews + edits → Save
```

### 4.3.2 Computer Vision Pipeline
```python
# YOLO v8 fine-tuned para detectar elementos construcción
import ultralytics

class ConstructionElementDetector:
    def __init__(self):
        # Modelo custom entrenado con planos anotados
        self.model = ultralytics.YOLO('models/construction_yolov8.pt')
        
        self.classes = [
            'wall_exterior', 'wall_interior', 'wall_partition',
            'door', 'window', 'column', 'beam',
            'stair', 'elevator', 'bathroom', 'kitchen'
        ]
    
    def detect(self, image_path: str) -> List[Detection]:
        results = self.model(image_path)
        
        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    'class': self.classes[int(box.cls)],
                    'confidence': float(box.conf),
                    'bbox': box.xyxy.tolist(),
                    'dimensions': self.calculate_real_dimensions(box, image_scale)
                })
        
        return detections
    
    def calculate_real_dimensions(self, bbox, scale):
        """
        Usa escala del plano (ej: 1:100) para dimensiones reales
        """
        pixel_width = bbox[2] - bbox[0]
        pixel_height = bbox[3] - bbox[1]
        
        real_width = pixel_width * scale
        real_height = pixel_height * scale
        
        return {'width': real_width, 'height': real_height}

# Agregación de mediciones
def aggregate_measurements(detections: List[Detection]) -> dict:
    """
    Agrupa elementos y suma cantidades
    """
    measurements = defaultdict(lambda: {'count': 0, 'total_area': 0, 'total_length': 0})
    
    for det in detections:
        element_type = det['class']
        measurements[element_type]['count'] += 1
        
        if element_type in ['wall_exterior', 'wall_interior']:
            length = det['dimensions']['width']  # o height según orientación
            measurements[element_type]['total_length'] += length
        
        elif element_type in ['door', 'window']:
            area = det['dimensions']['width'] * det['dimensions']['height']
            measurements[element_type]['total_area'] += area
    
    return measurements

# Matching con partidas presupuesto
def match_to_budget_items(measurements: dict) -> List[BudgetItem]:
    """
    IA mapea elementos detectados → partidas presupuesto
    """
    prompt = f"""
    Mediciones detectadas:
    {json.dumps(measurements, indent=2)}
    
    Mapea a partidas de presupuesto estándar (código BEDEC si existe).
    Para cada elemento, sugiere:
    - Código partida
    - Descripción
    - Unidad (m, m², m³, ud)
    - Cantidad
    - Precio orientativo €/unidad
    
    Devuelve JSON array.
    """
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    items = json.loads(response.content)
    return items
```

### 4.3.3 Integración BIM (IFC)
```python
import ifcopenshell

def extract_measurements_from_ifc(ifc_path: str) -> dict:
    """
    Lee modelo IFC y extrae mediciones
    """
    ifc_file = ifcopenshell.open(ifc_path)
    
    measurements = {
        'walls': [],
        'slabs': [],
        'columns': [],
        'beams': [],
        'doors': [],
        'windows': []
    }
    
    # Muros
    for wall in ifc_file.by_type('IfcWall'):
        measurements['walls'].append({
            'id': wall.GlobalId,
            'name': wall.Name,
            'length': get_wall_length(wall),
            'height': get_wall_height(wall),
            'thickness': get_wall_thickness(wall),
            'area': get_wall_area(wall),
            'material': get_wall_material(wall)
        })
    
    # Forjados
    for slab in ifc_file.by_type('IfcSlab'):
        measurements['slabs'].append({
            'id': slab.GlobalId,
            'area': get_slab_area(slab),
            'thickness': get_slab_thickness(slab),
            'volume': get_slab_volume(slab)
        })
    
    # ... etc para otros elementos
    
    return measurements

def get_wall_area(wall):
    """
    Calcula área de muro desde geometría IFC
    """
    # IfcWall tiene representación geométrica
    shape = ifcopenshell.geom.create_shape(settings, wall)
    # Extraer área de superficies
    return calculate_surface_area(shape)
```

### 4.3.4 Entidades de Datos
```python
class Measurement(BaseModel):
    id: UUID
    project_id: UUID
    source_file_url: str  # PDF/DWG/IFC origin
    
    items: List[MeasurementItem]
    
    status: str  # 'processing', 'review', 'approved'
    created_at: datetime
    approved_by: UUID | None

class MeasurementItem(BaseModel):
    id: UUID
    measurement_id: UUID
    
    # Partida
    code: str  # Código BEDEC o custom
    description: str
    unit: str  # 'm', 'm2', 'm3', 'ud'
    quantity: float
    unit_price: float | None
    
    # Origen
    detected_by_ai: bool
    confidence: float  # 0-1
    source_elements: List[str]  # IDs elementos detectados
    
    # Edición manual
    manual_override: bool
    notes: str | None
```

---

## 4.4 Módulo 3: PrestoIA (Presupuestos Inteligentes)

### 4.4.1 Features Core
```python
# 1. Excel → Presupuesto estructurado
def import_excel_budget(excel_path: str) -> Budget:
    """
    IA parsea Excel caótico y estructura presupuesto
    """
    df = pd.read_excel(excel_path)
    
    # IA detecta estructura
    prompt = f"""
    Excel con {len(df)} filas.
    Primeras 10 filas:
    {df.head(10).to_string()}
    
    Identifica:
    - Fila header (columnas: código, descripción, unidad, cantidad, precio)
    - Filas de capítulos (títulos)
    - Filas de partidas (datos numéricos)
    - Filas a ignorar (vacías, totales)
    
    Devuelve JSON con mapping.
    """
    
    structure = openai.chat.completions.create(...)
    
    # Parsear según estructura detectada
    budget = parse_budget(df, structure)
    
    # Validar y limpiar
    budget = validate_budget(budget)
    
    return budget

# 2. Sugerencias inteligentes de partidas
def suggest_budget_items(description: str, context: dict) -> List[BudgetItem]:
    """
    Al escribir descripción, IA sugiere partidas completas
    """
    # Buscar en base de datos histórica
    similar_items = vector_search(description, top_k=5)
    
    # Enriquecer con IA
    prompt = f"""
    Usuario escribió: "{description}"
    
    Proyectos similares usaron: {similar_items}
    
    Sugiere partida completa:
    - Código (si BEDEC, usar código real)
    - Descripción técnica detallada
    - Unidad apropiada
    - Precio €/unidad orientativo (mercado España 2026)
    """
    
    suggestions = openai.chat.completions.create(...)
    
    return suggestions

# 3. Detección errores y anomalías
def detect_budget_errors(budget: Budget) -> List[Error]:
    """
    IA revisa presupuesto y detecta problemas
    """
    errors = []
    
    # Reglas deterministas
    errors += check_duplicate_items(budget)
    errors += check_unit_coherence(budget)
    errors += check_quantity_reasonableness(budget)
    
    # IA detect anomalies
    prompt = f"""
    Presupuesto con {len(budget.items)} partidas.
    Total: {budget.total}€
    
    Revisa y detecta:
    - Partidas duplicadas (misma descripción, distinto código)
    - Precios fuera de mercado (muy altos/bajos)
    - Cantidades sospechosas
    - Incoherencias (ej: más m² alicatado que superficie total)
    
    {budget.to_summary()}
    """
    
    ai_errors = openai.chat.completions.create(...)
    
    return errors + ai_errors
```

### 4.4.2 Entidades de Datos
```python
class Budget(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    version: int
    
    chapters: List[Chapter]
    
    subtotal: float
    taxes: float
    total: float
    
    status: str  # 'draft', 'sent', 'approved'
    created_at: datetime

class Chapter(BaseModel):
    id: UUID
    code: str  # '01', '02', etc
    title: str  # 'Movimiento de tierras', 'Cimentación'
    items: List[BudgetItem]
    subtotal: float

class BudgetItem(BaseModel):
    id: UUID
    chapter_id: UUID
    
    code: str
    description: str
    unit: str
    quantity: float
    unit_price: float
    total: float  # quantity * unit_price
    
    # IA metadata
    suggested_by_ai: bool
    confidence: float
    alternatives: List[BudgetItem] | None  # otras opciones
    
    notes: str | None
```

---

# 5. FASES DE DESARROLLO

## FASE 0: Pre-Desarrollo (2 semanas)

### Objetivos
- Setup infraestructura base
- Decisiones stack final
- Contratación team (si aplica)

### Deliverables
```
✅ Repositorio GitHub con estructura monorepo
✅ CI/CD básico configurado
✅ Entornos: dev, staging, production
✅ DB schema inicial (PostgreSQL)
✅ Auth básico funcionando (Supabase/Auth0)
✅ Landing page + waitlist
```

### Team
- 1 Full-stack lead (tú o CTO)
- 1 DevOps (puede ser contractor part-time)

### Presupuesto
- Infra: 200€/mes (Supabase, Vercel, Cloudflare)
- Tools: 100€/mes (GitHub, Linear, Figma)
- **Total: ~300€/mes**

---

## FASE 1: MVP - CertIA (12 semanas)

### Semanas 1-2: Setup & Arquitectura
**Objetivo**: Base sólida para construir sobre ella

**Tasks**:
- [ ] Monorepo structure (Turborepo / Nx)
  ```
  buildai/
  ├── apps/
  │   ├── web/          # React app
  │   ├── api/          # FastAPI backend
  │   └── mobile/       # React Native (opcional Fase 1)
  ├── packages/
  │   ├── ui/           # Shared components
  │   ├── types/        # TypeScript types
  │   └── utils/        # Shared utilities
  ├── services/
  │   ├── auth/         # Auth service
  │   ├── certia/       # CertIA module
  │   └── core/         # Core services
  └── docker-compose.yml
  ```

- [ ] Database schema (v1)
  ```sql
  -- Core tables
  CREATE TABLE users (...);
  CREATE TABLE tenants (...);
  CREATE TABLE projects (...);
  CREATE TABLE project_files (...);
  
  -- CertIA tables
  CREATE TABLE energy_certificates (...);
  CREATE TABLE improvements (...);
  ```

- [ ] API structure (FastAPI)
  ```
  api/
  ├── main.py
  ├── routers/
  │   ├── auth.py
  │   ├── projects.py
  │   └── certificates.py
  ├── models/
  ├── schemas/
  ├── services/
  │   ├── ocr_service.py
  │   ├── cadastro_service.py
  │   └── ai_service.py
  └── utils/
  ```

**Deliverable**: Proyecto corriendo localmente, deploy staging

---

### Semanas 3-4: Core Features
**Objetivo**: User puede crear cuenta y subir primer proyecto

**Tasks**:
- [ ] Frontend: Auth flows (signup, login, forgot password)
- [ ] Frontend: Dashboard básico
- [ ] Frontend: Crear proyecto + upload file
- [ ] Backend: File upload to S3/R2
- [ ] Backend: Project CRUD
- [ ] Tests: E2E happy path

**Deliverable**: Usuario puede registrarse y subir PDF

---

### Semanas 5-7: IA Pipeline - OCR & Extraction
**Objetivo**: Extraer datos automáticamente de plano

**Tasks**:
- [ ] Integrate Tesseract OCR
- [ ] PDF → Images pipeline
- [ ] GPT-4 Vision para extraer datos estructurados
- [ ] Catastro API integration
- [ ] Fallback manual input (si OCR falla)
- [ ] Frontend: Review extracted data screen

**Deliverable**: IA extrae superficie, orientación, huecos de plano PDF

---

### Semanas 8-10: Energy Calculation & Recommendations
**Objetivo**: Calcular rating energético y sugerir mejoras

**Tasks**:
- [ ] Implementar lógica cálculo energético (CTE simplificado)
- [ ] Rating A-G según consumo
- [ ] IA genera recomendaciones de mejora
- [ ] Calcular ROI de mejoras
- [ ] Frontend: Results screen con rating visual
- [ ] Frontend: Improvements table

**Deliverable**: Sistema calcula rating y sugiere 3-5 mejoras

---

### Semanas 11-12: PDF Generation & Polish
**Objetivo**: Generar certificado oficial descargable

**Tasks**:
- [ ] Template certificado oficial (formato IDAE)
- [ ] Generate PDF (WeasyPrint / Playwright PDF)
- [ ] Email notification cuando ready
- [ ] Frontend: Polish UI/UX
- [ ] Bug fixes & testing
- [ ] Documentation

**Deliverable**: Certificado PDF descargable, MVP listo para beta users

---

### Métricas Éxito Fase 1
- [ ] 20 beta users registered
- [ ] 50 certificados generados
- [ ] 85%+ accuracy en OCR (validado manualmente)
- [ ] <2 min tiempo procesamiento (upload → PDF)
- [ ] NPS >50 entre beta users

### Team Fase 1
- 1 Full-stack lead (75% backend, 25% frontend)
- 1 Frontend dev (React)
- 1 ML Engineer part-time (OCR + IA pipelines)
- Total: 2.5 FTE

### Presupuesto Fase 1
- Salarios: 15-20k€ (si contractors) o 0€ (si founder solo)
- Infra: 500€/mes × 3 = 1.5k€
- APIs (OpenAI, Google): 1k€
- **Total: ~17-22k€**

---

## FASE 2: Bundle Aparejador (Semanas 13-26, ~3 meses)

### Objetivos
- Lanzar MediIA (Mediciones)
- Lanzar PrestoIA (Presupuestos)
- Integrar 3 productos en bundle

### Semana 13-14: Planning & Architecture
- [ ] Design DB schema para Mediciones y Presupuestos
- [ ] API endpoints design
- [ ] Definir conectores entre módulos
- [ ] Priorizar features (MVP de cada módulo)

### Semanas 15-19: MediIA Development
**Features MVP**:
- [ ] Upload PDF plano
- [ ] OCR básico (detectar texto, dimensiones)
- [ ] YOLO detección elementos (muros, puertas, ventanas)
- [ ] Tabla de mediciones editable
- [ ] Export Excel/PDF

**No incluir en MVP**:
- ❌ IFC/BIM (Fase 3)
- ❌ Medición con fotos (Fase 3)
- ❌ Detección super precisa (70% accuracy OK para MVP)

### Semanas 20-24: PrestoIA Development
**Features MVP**:
- [ ] Crear presupuesto manual (UI tipo spreadsheet)
- [ ] Import Excel → Presupuesto estructurado (IA)
- [ ] Sugerencias partidas (IA typeahead)
- [ ] Detección errores básica (duplicados, unidades)
- [ ] Export PDF presupuesto

**No incluir en MVP**:
- ❌ BC3 export (Fase 3)
- ❌ Comparador versiones avanzado (Fase 3)

### Semanas 25-26: Integration & Bundle
- [ ] Conector MediIA → PrestoIA (mediciones alimentan presupuesto)
- [ ] Conector CertIA ← PrestoIA (presupuesto mejoras)
- [ ] Bundle pricing & billing
- [ ] Landing bundle + marketing
- [ ] Beta testing integración

### Métricas Éxito Fase 2
- [ ] 100 usuarios pagando (50 individual, 50 bundle)
- [ ] MRR: 15k€/mes
- [ ] Churn <5%/mes
- [ ] 30% conversión free → paid

### Team Fase 2
- 2 Full-stack devs
- 1 Frontend dev
- 1 ML Engineer (50%)
- 1 Product Manager (tú)
- Total: 3.5 FTE

### Presupuesto Fase 2
- Salarios: 40-50k€ (3 meses)
- Infra: 1k€/mes × 3 = 3k€
- APIs: 2k€
- Marketing: 5k€
- **Total: ~50-60k€**

---

## FASE 3: Expansión Técnica (Meses 7-12)

### Productos a Lanzar
1. **StructIA** (Cálculo Estructural) - Meses 7-9
2. **MEPIA** (Instalaciones) - Meses 10-12
3. **QualityIA** (Control Calidad) - Paralelo a MEPIA

### Desarrollo Paralelo
- 2 teams trabajando simultáneamente
- Team A: StructIA (más complejo)
- Team B: MEPIA + QualityIA (menos complejo)

### Métricas Éxito Fase 3
- [ ] 500 usuarios totales
- [ ] MRR: 75k€/mes
- [ ] 3 bundles activos en mercado
- [ ] ARR: ~900k€

### Team Fase 3
- 4 Full-stack devs (2 teams)
- 2 Frontend devs
- 1 ML Engineer
- 1 Product Manager
- 1 DevOps Engineer
- Total: 8 FTE

### Presupuesto Fase 3
- Salarios: 120-150k€ (6 meses)
- Infra: 3k€/mes × 6 = 18k€
- APIs: 10k€
- Marketing: 30k€
- **Total: ~178-208k€**

---

## FASE 4: Scale & Enterprise (Año 2)

### Objetivos
- Suite completa para estudios (BIM + todos módulos)
- Enterprise features (multi-tenant avanzado, SSO, API pública)
- Expansión geográfica (Portugal, Latinoamérica)

### Features Enterprise
- [ ] SSO (SAML, OAuth)
- [ ] Advanced RBAC
- [ ] Audit logs completos
- [ ] API pública documentada
- [ ] Webhooks
- [ ] Custom integrations (ERP, contabilidad)
- [ ] White-label (opcional)

### Métricas Éxito Fase 4
- [ ] 2.000 usuarios
- [ ] 50 clientes Enterprise
- [ ] ARR: 3M€

---

# 6. ESTIMACIÓN RECURSOS & COSTES

## 6.1 Team Evolución

| Fase | Duración | FTEs | Roles |
|------|----------|------|-------|
| **Fase 0** | 2 semanas | 1.5 | Lead dev + DevOps part-time |
| **Fase 1** | 3 meses | 2.5 | Lead dev + Frontend + ML part-time |
| **Fase 2** | 3 meses | 3.5 | 2 Full-stack + Frontend + ML 50% |
| **Fase 3** | 6 meses | 8 | 4 Full-stack + 2 Frontend + ML + PM + DevOps |
| **Fase 4** | 12 meses | 15+ | Full team + Sales + Customer Success |

## 6.2 Budget Summary (Primeros 18 Meses)

| Concepto | Fase 1 (3m) | Fase 2 (3m) | Fase 3 (6m) | Total |
|----------|-------------|-------------|-------------|-------|
| **Salarios** | 20k€ | 45k€ | 135k€ | 200k€ |
| **Infra & Tools** | 2k€ | 3k€ | 20k€ | 25k€ |
| **APIs (IA)** | 1k€ | 2k€ | 10k€ | 13k€ |
| **Marketing** | 2k€ | 5k€ | 30k€ | 37k€ |
| **Legal & Admin** | 2k€ | 2k€ | 5k€ | 9k€ |
| **Contingencia (15%)** | 4k€ | 9k€ | 30k€ | 43k€ |
| **TOTAL** | **31k€** | **66k€** | **230k€** | **327k€** |

### Revenue Proyección (Conservador)

| Mes | Usuarios | MRR | Acumulado |
|-----|----------|-----|-----------|
| **M3** (Fin Fase 1) | 20 beta | 0€ | 0€ |
| **M6** (Fin Fase 2) | 100 | 15k€ | 45k€ |
| **M12** (Fin Fase 3) | 500 | 75k€ | 495k€ |
| **M18** | 1.000 | 150k€ | 1.395k€ |

**Breakeven**: Mes 14-16 (con funding inicial de 327k€)

---

# 7. RIESGOS TÉCNICOS & MITIGACIÓN

## 7.1 Riesgo: Accuracy IA insuficiente

**Problema**: OCR extrae datos mal, usuarios no confían

**Mitigación**:
- Siempre mostrar datos extraídos para validación humana
- Confidence scores visibles
- Fallback a input manual fácil
- Iterar modelos con feedback usuarios

**Métrica**: >85% accuracy en extracción datos críticos

---

## 7.2 Riesgo: Performance con archivos grandes

**Problema**: IFC de 500MB tarda 10min procesar

**Mitigación**:
- Processing asíncrono (Celery)
- Progress bars con ETAs
- Incremental processing
- Límites de archivo (upgrade para más)

**Métrica**: 90% archivos procesados <2min

---

## 7.3 Riesgo: Escalabilidad costes IA

**Problema**: APIs OpenAI cuestan 10€/certificado, inviable

**Mitigación**:
- Entrenar modelos propios para tareas repetitivas
- Cache de embeddings/resultados
- Batching requests
- Pricing que cubre costes (15€/certificado)

**Métrica**: Coste IA <30% del precio venta

---

## 7.4 Riesgo: Complejidad técnica StructIA

**Problema**: Cálculo estructural mal puede causar problemas legales

**Mitigación**:
- Disclaimer claro: "Software asistencia, ingeniero responsable"
- Validación con ingenieros profesionales
- Seguro responsabilidad civil producto
- Conservative calculations (pecar de sobre-diseño)
- Fase beta extendida con expertos

**Métrica**: 0 incidentes graves en 12 meses

---

## 7.5 Riesgo: Dependencia APIs externas

**Problema**: OpenAI cambia pricing o depreca modelo

**Mitigación**:
- Abstracción (adapter pattern)
- Multi-provider (OpenAI + Anthropic + Azure)
- Modelos open source de backup (Llama, Mistral)
- Contratos Enterprise con providers

---

# 8. STACK DECISIÓN FINAL RECOMENDADO

## Para Startup Pre-Seed (0-100k€ funding)

```yaml
Frontend:
  - Framework: Next.js 14 (App Router)
  - Hosting: Vercel (gratis hasta límite)
  - UI: shadcn/ui + Tailwind

Backend:
  - Framework: FastAPI (Python)
  - Hosting: Render.com / Railway (50€/mes)
  - DB: Supabase PostgreSQL (gratis)
  - Storage: Cloudflare R2 (barato)
  - Auth: Supabase Auth (gratis)

IA:
  - OCR: Tesseract (open source)
  - LLM: OpenAI API (pago por uso)
  - Vision: GPT-4 Vision
  - Vector DB: Supabase pgvector (gratis)

Total coste infra: ~200€/mes hasta 1k usuarios
```

## Para Startup Seed (100-500k€ funding)

```yaml
Frontend: Igual que arriba

Backend:
  - Hosting: AWS ECS Fargate
  - DB: RDS PostgreSQL
  - Cache: ElastiCache Redis
  - Storage: S3
  - Auth: Auth0 (mejor que Supabase para scale)

IA:
  - OCR: Tesseract + AWS Textract
  - LLM: OpenAI + Anthropic (redundancia)
  - Vision: GPT-4V + modelos propios
  - Vector DB: Pinecone
  - GPU compute: Modal / Replicate

Total coste: ~2-5k€/mes hasta 10k usuarios
```

---

# 9. CONCLUSIÓN & NEXT STEPS

## ✅ Checklist Antes de Empezar Desarrollo

### Pre-requisitos
- [ ] Validación problema (10+ conversaciones usuarios)
- [ ] Decidido producto inicial (CertIA recomendado)
- [ ] Funding asegurado (mínimo 30k€ para Fase 1)
- [ ] CTO/Lead dev identificado
- [ ] Stack tecnológico decidido

### Semana 1
- [ ] Incorporar empresa (SL en España)
- [ ] Setup repo + CI/CD
- [ ] Contratar infra (Supabase, Vercel, etc)
- [ ] Diseño inicial UI/UX (Figma)

### Semana 2-12
- [ ] Ejecutar Fase 1 según roadmap
- [ ] Testing semanal con 2-3 beta users
- [ ] Ajustar según feedback

### Mes 4
- [ ] Lanzamiento público CertIA
- [ ] Onboarding primeros 100 usuarios
- [ ] Monetización activa

---

