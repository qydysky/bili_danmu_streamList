import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.directive( 'vTablescroll', {
	mounted(el,binding) {
        const sign = 50
        const selectwrap = el.querySelector('.el-scrollbar__wrap')
        if (selectwrap == null) return
        selectwrap.scrollFn = function () {
            const scrollDistance = this.scrollHeight - this.scrollTop - this.clientHeight
            if (scrollDistance <= sign)binding.value(selectwrap)
        }
        selectwrap.addEventListener( 'scroll', selectwrap.scrollFn)
        selectwrap.scrollFn()
    },
    unmounted(el){
        const selectwrap = el.querySelector('.el-scrollbar__wrap')
        if (selectwrap == null) return
        selectwrap.removeEventListener( 'scroll' , selectwrap.scrollFn)
        selectwrap.scrollFn = null
    }
})
app.use(ElementPlus)
app.mount('#app')