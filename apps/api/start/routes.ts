import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#modules/auth/controllers/auth_controller')
const HealthController = () => import('#modules/health/controllers/health_controller')
const MaterialsController = () => import('#modules/materials/controllers/materials_controller')
const ProductsController = () => import('#modules/products/controllers/products_controller')
const PatternSetsController = () =>
  import('#modules/pattern_sets/controllers/pattern_sets_controller')
const BillsOfMaterialsController = () =>
  import('#modules/bills_of_materials/controllers/bills_of_materials_controller')
const ProductVariantsController = () =>
  import('#modules/products/controllers/product_variants_controller')
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
    router.get('/materials/search', [MaterialsController, 'search'])
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
    router.get('/products/:productId/variants', [ProductVariantsController, 'index'])
    router.post('/products/:productId/variants', [ProductVariantsController, 'store'])
    router.put('/products/:productId/variants/:variantId', [ProductVariantsController, 'update'])
    router.delete('/products/:productId/variants/:variantId', [
      ProductVariantsController,
      'destroy',
    ])
    router.post('/products/:productId/variants/:variantId/restore', [
      ProductVariantsController,
      'restore',
    ])
    router.get('/pattern-sets', [PatternSetsController, 'index'])
    router.get('/pattern-sets/search', [PatternSetsController, 'search'])
    router.get('/pattern-sets/:patternSetId', [PatternSetsController, 'show'])
    router.get('/pattern-sets/:patternSetId/usage', [PatternSetsController, 'usage'])
    router.post('/pattern-sets', [PatternSetsController, 'store'])
    router.put('/pattern-sets/:patternSetId', [PatternSetsController, 'update'])
    router.delete('/pattern-sets/:patternSetId', [PatternSetsController, 'destroy'])
    router.post('/pattern-sets/:patternSetId/restore', [PatternSetsController, 'restore'])
    router.get('/bills-of-materials', [BillsOfMaterialsController, 'index'])
    router.get('/bills-of-materials/:billOfMaterialsId', [BillsOfMaterialsController, 'show'])
    router.post('/bills-of-materials', [BillsOfMaterialsController, 'store'])
    router.post('/bills-of-materials/:billOfMaterialsId/product', [
      BillsOfMaterialsController,
      'associateProduct',
    ])
  })
  .use(middleware.bearerAuth())
