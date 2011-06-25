var path = require('path')
  , localDir = path.dirname(module.pathname)
  , intDir = path.join(localDir, './internal')


require.paths.unshift(localDir)
require.paths.unshift(intDir)
