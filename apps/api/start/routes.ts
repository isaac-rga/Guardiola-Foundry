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
router.get('/auth/me', [AuthController, 'me'])
router.get('/materials', [MaterialsController, 'index'])
router.get('/materials/:materialId', [MaterialsController, 'show']).use(middleware.bearerAuth())
router
  .post('/materials/:materialId/sources', [MaterialsController, 'linkSource'])
  .use(middleware.bearerAuth())
router
  .delete('/materials/:materialId/sources/:sourceId', [MaterialsController, 'unlinkSource'])
  .use(middleware.bearerAuth())
router
  .put('/materials/:materialId/preferred-source', [MaterialsController, 'replacePreferredSource'])
  .use(middleware.bearerAuth())
router
  .get('/currency-conversion-rate', [CurrencyConversionRatesController, 'show'])
  .use(middleware.bearerAuth())
router.get('/sources', [SourcesController, 'index']).use(middleware.bearerAuth())
router.post('/sources', [SourcesController, 'store']).use(middleware.bearerAuth())
router.get('/sources/:sourceId', [SourcesController, 'show']).use(middleware.bearerAuth())
router.put('/sources/:sourceId', [SourcesController, 'update']).use(middleware.bearerAuth())
router.delete('/sources/:sourceId', [SourcesController, 'destroy']).use(middleware.bearerAuth())
router
  .post('/sources/:sourceId/restore', [SourcesController, 'restore'])
  .use(middleware.bearerAuth())
router.get('/products', [ProductsController, 'index'])
router.post('/products', [ProductsController, 'store'])
router.get('/products/:productId', [ProductsController, 'show'])
router.put('/products/:productId', [ProductsController, 'update'])
router.delete('/products/:productId', [ProductsController, 'destroy'])
router.post('/products/:productId/restore', [ProductsController, 'restore'])
