import router from '@adonisjs/core/services/router'

const AuthController = () => import('#modules/auth/controllers/auth_controller')
const HealthController = () => import('#modules/health/controllers/health_controller')

router.get('/health', [HealthController, 'show'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout'])
router.post('/auth/change-password', [AuthController, 'changePassword'])
router.get('/auth/me', [AuthController, 'me'])
