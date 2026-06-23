import router from '@adonisjs/core/services/router'

const HealthController = () => import('#modules/health/controllers/health_controller')

router.get('/health', [HealthController, 'show'])
