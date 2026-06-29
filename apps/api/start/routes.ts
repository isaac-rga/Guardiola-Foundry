import router from '@adonisjs/core/services/router'

const AuthController = () => import('#modules/auth/controllers/auth_controller')
const HealthController = () => import('#modules/health/controllers/health_controller')

router.get('/health', [HealthController, 'show'])
router.post('/auth/login', [AuthController, 'login'])
