import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
app.directive( 'vTablescroll', {
	mounted(el,binding) {
        const selectwrap = el.querySelector('.el-scrollbar_wrap')
        if (selectwrap == null) return
        selectwrap.scrollFn = function () {
        const sign = 0
        const scrollDistance =
            this.scrollHeight - this.scrollTop - this.clientHeight
            if ( scrollDistance <= sign) {
            binding.value()
            }
        }
        selectwrap.addEventListener( 'scroll', selectwrap.scrollFn)
    },
    unmounted(el){
        const selectwrap = el.querySelector('.el-scrollbar_wrap')
        if (selectwrap == null) return
        selectwrap. removeEventListener( 'scroll' , selectwrap.scrollFn)
        selectwrap.scrollFn = null
    }
})