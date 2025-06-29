// export default {
//   register(/* { strapi } */) {},
//   bootstrap(/* { strapi } */) {},
// };

export default {
  register(/* { strapi } */) {
    console.log('🔧 Strapi Register Phase');
  },

  bootstrap({ strapi }) {
    console.log('🚀 Strapi Bootstrap Phase Starting...');
    
    setTimeout(() => {
      console.log('🔍 DIAGNOSTIC: Checking content types and lifecycles...');
      
      // Проверка на всички content types
      const contentTypes = Object.keys(strapi.contentTypes);
      console.log('📋 Available content types:', contentTypes);
      
      // Специфична проверка за order
      const orderContentType = strapi.contentTypes['api::order.order'];
      console.log('🛒 Order content type exists:', !!orderContentType);
      
      if (orderContentType) {
        console.log('📄 Order content type details:');
        console.log('  - UID:', orderContentType.uid);
        console.log('  - Kind:', orderContentType.kind);
        console.log('  - Model Name:', orderContentType.modelName);
        console.log('  - Has lifecycles:', !!orderContentType.lifecycles);
        
        if (orderContentType.lifecycles) {
          console.log('  - Lifecycle methods:', Object.keys(orderContentType.lifecycles));
        } else {
          console.log('  - ❌ NO LIFECYCLES FOUND!');
        }
      }
      
      // Проверка на всички API директории
      console.log('📁 Checking API structure...');
      const fs = require('fs');
      const path = require('path');
      
      try {
        const apiPath = path.join(process.cwd(), 'src', 'api');
        const apiDirs = fs.readdirSync(apiPath);
        console.log('📂 API directories:', apiDirs);
        
        apiDirs.forEach(dir => {
          const lifecyclePath = path.join(apiPath, dir, 'content-types', dir, 'lifecycles');
          if (fs.existsSync(lifecyclePath)) {
            const lifecycleFiles = fs.readdirSync(lifecyclePath);
            console.log(`📄 ${dir} lifecycle files:`, lifecycleFiles);
          }
        });
      } catch (error) {
        console.error('❌ Error checking API structure:', error.message);
      }
      
    }, 2000);
  },
};