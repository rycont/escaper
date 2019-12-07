import Vue from 'vue'
import App from './App.vue'
import 'core-js/es/set'

import './registerServiceWorker'

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
