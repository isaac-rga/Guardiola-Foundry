import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#modules/auth/controllers/auth_controller')
const HealthController = () => import('#modules/health/controllers/health_controller')
const MaterialsController = () => import('#modules/materials/controllers/materials_controller')
const ProductsController = () => import('#modules/products/controllers/products_controller')
const SourcesController = () => import('#modules/sources/controllers/sources_controller')
const CurrencyConversionRatesController = () =>
  import('#modules/sources/controllers/currency_conversion_rates_controller')

router.get('/health', [HealthController, 'show'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout'])
router.post('/auth/change-password', [AuthController, 'changePassword'])
router
  .group(() => {
    router.get('/auth/me', [AuthController, 'me'])
    router.get('/materials', [MaterialsController, 'index'])
    router.get('/materials/:materialId', [MaterialsController, 'show'])
    router.post('/materials/:materialId/sources', [MaterialsController, 'linkSource'])
    router.delete('/materials/:materialId/sources/:sourceId', [MaterialsController, 'unlinkSource'])
    router.put('/materials/:materialId/preferred-source', [
      MaterialsController,
      'replacePreferredSource',
    ])
    router.get('/currency-conversion-rate', [CurrencyConversionRatesController, 'show'])
    router.get('/sources', [SourcesController, 'index'])
    router.post('/sources', [SourcesController, 'store'])
    router.get('/sources/:sourceId', [SourcesController, 'show'])
    router.put('/sources/:sourceId', [SourcesController, 'update'])
    router.delete('/sources/:sourceId', [SourcesController, 'destroy'])
    router.post('/sources/:sourceId/restore', [SourcesController, 'restore'])
    router.get('/products', [ProductsController, 'index'])
    router.post('/products', [ProductsController, 'store'])
    router.get('/products/:productId', [ProductsController, 'show'])
    router.put('/products/:productId', [ProductsController, 'update'])
    router.delete('/products/:productId', [ProductsController, 'destroy'])
    router.post('/products/:productId/restore', [ProductsController, 'restore'])
  })
  .use(middleware.bearerAuth())
