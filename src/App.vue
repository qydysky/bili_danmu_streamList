<script>
import Axios from 'axios'
import { setupCache } from 'axios-cache-interceptor';
import { nextTick, reactive } from 'vue';
import {ElSelect,ElOption,ElSpace,ElText,ElDescriptions,ElDescriptionsItem,ElLink,ElPopover,ElButton,ElDatePicker,ElInput,ElTable,ElTableColumn,ElForm,ElFormItem} from 'element-plus';
export default {
    components:{
        ElSelect,ElOption,ElSpace,ElText,ElDescriptions,ElDescriptionsItem,ElLink,ElPopover,ElButton,ElDatePicker,ElInput,ElTable,ElTableColumn,ElForm,ElFormItem
    },
    data() {
        return {
            search: {},
            loopLoading: false,
            stopLoad: false,
            tableData: [],
            form: reactive({
                up: '',
                recDate: '',
                startDate: '',
                sort: 'startTDsc'
            }),
            defaultDate: new Date(),
            hadSave: false,
            sortOption: [
                {
                    value: 'startTAsc',
                    label: '时间升序',
                },
                {
                    value: 'startTDsc',
                    label: '时间降序',
                }
                
            ]
        }
    },
    computed: {
        defaultDateF: {
            get() {
                return this.defaultDate
            },
            set(defaultDate) {
                this.defaultDate = defaultDate
            }
        },
    },
    methods: {
        saveSearch() {
            let para = new URL(window.location.href).searchParams.get("ref");
            para = para?para:""
            this.search[para] = this.form
            localStorage.setItem("search",JSON.stringify(this.search))
        },
        getSearch() {
            let para = new URL(window.location.href).searchParams.get("ref");
            para = para?para:""
            this.search = localStorage.getItem("search")
            this.search = this.search?JSON.parse(this.search):{}
            let searchRef = this.search[para]
            searchRef = searchRef?searchRef:{}
            this.form.up = searchRef.up?searchRef.up:""
            this.form.recDate = searchRef.recDate?searchRef.recDate:""
            this.form.startDate = searchRef.startDate?searchRef.startDate:""
            this.form.sort = searchRef.sort?searchRef.sort:"startTDsc"
        },
        rowClick(data) {
            let para = new URL(window.location.href).searchParams;
            window.open("player/?ref="+(para.has("ref")?para.get("ref"):"")+data.path+(data.format?"&format="+data.format:""))
        },
        hotRowClick(data) {
            let para = new URL(window.location.href).searchParams;
            window.open(
                "player/?ref="+
                (para.has("ref")?para.get("ref"):"")+
                data.path+
                (data.format?"&format="+data.format:"")+
                (data.st?"&st="+data.st+"m":"")+
                (data.dur?"&dur="+data.dur+"m":"")+
                (data.modeq?"&modeq="+data.modeq:"")
            )
        },
        colspan({
            row,
            column,
            rowIndex,
            columnIndex,
        }) {
            if(row.firstSpan && columnIndex == 0)return {rowspan: 2, colspan: 1}
            if(row.colspan && columnIndex == 0)return {rowspan: 1, colspan: 0}
            if(row.colspan && columnIndex == 1)return {rowspan: 1, colspan: 10}
            return {rowspan: 1, colspan: 1}
        },
        loadFileList(){
            if(this.stopLoad)return

            let el = document.querySelector('#table').querySelector(".el-scrollbar__wrap")
            const scrollDistance = el.scrollHeight - el.scrollTop - el.clientHeight
            if (scrollDistance > 50)return

            if(this.loopLoading)return console.log("skip")
            this.loopLoading = true

            let that = this
            const axios = setupCache(Axios.create());
            let para = new URL(window.location.href).searchParams;
            let max = array => (array&&array.length>0)?Math.round(array.reduce((a,b)=>a>b?a:b)):0;
                
            axios.get(
                'filePath?size=10'+
                (para.has("ref")?'&ref='+para.get("ref"):"")+
                (this.form.up?'&uname='+this.form.up:"")+
                (this.form.recDate?'&startT='+this.form.recDate:"")+
                (this.form.startDate?'&startLiveT='+this.form.startDate:"")+
                (this.form.sort?'&sort='+this.form.sort:"")+
                '&skip='+this.tableData.length
            )
            .then(function (response) {
                const load = async (data) => {
                    if(!data || res.data.length==0){
                        that.loopLoading = false
                        that.stopLoad = true
                        return
                    }

                    let refm = {}
                    {
                        let refs = []
                        for (let index = 0; data && index < data.length; index++) {
                            if(data[index].path!=`now`)refs.push((para.has("ref")?para.get("ref"):"")+data[index].path)
                        }
                        await axios.post('danmuCountPerMins', refs)
                        .then(function (response) {
                            if(!response || response.length==0 || !response.data)return
                            refm = response.data
                        })
                    }

                    for (let index = 0; data && index < data.length; index++) {
                        const element = data[index]
                        let result2 = []
                        if (element.cuts) {
                            for (let j = 0; j < element.cuts.length; j++) {
                                const cut = element.cuts[j];
                                result2.push({st:cut.st,dur:cut.dur,path:element.path,format:element.format,point:cut.title})
                            }
                        }
                        if(element.path==`now`){
                            await axios.get('streamMode')
                            .then(function (response) {
                                const load = async (data) => {
                                    for (let index = 0; data && index < data.length; index++) {
                                        const modeq = data[index]
                                        result2.push({st:modeq,path:element.path,format:element.format,modeq:modeq})
                                    }
                                };
                                let res = response.data
                                if (res.code == 0)load(res.data)
                                else console.error(res.message)
                            })
                            .catch(console.error)
                            .finally(()=>{
                                that.tableData.push({
                                    startLiveT: element.startLiveT,
                                    format:element.format,
                                    uname: element.uname,
                                    name: element.name,
                                    path: element.path,
                                    qn: element.qn,
                                    avgOnline: max(element.onlinesPerMin),
                                    startT: element.startT,
                                    druT: element.endT&&element.startT?((Date.parse(element.endT)-Date.parse(element.startT))/1000/60).toFixed(2)+"min":"",
                                    hot: (result2.length>0?result2:undefined)
                                })
                            })
                        } else {
                            let data = refm[(para.has("ref")?para.get("ref"):"")+element.path]
                            let avg = array => (array&&array.length>0)?(array.reduce((a,b)=>a+b)/array.length):0;
                            let avgC = avg(data) 
                            let result = []
                            data.forEach((v,k)=>{
                                if(v>=avgC*1.5){
                                    result.push(k)
                                }
                            })
                            if(result.length>0){
                                let mergedOP = -1
                                let m = a => a>0.5?a-0.5:a
                                if(result.length==1)result2.push({st:m(result[0]),point:data[result[0]],dur:1.5,path:element.path,format:element.format})
                                else {
                                    result.reduce((a,b)=>{
                                        if(b-a<2){
                                            if(mergedOP==-1)mergedOP = a
                                        } else if(mergedOP==-1)result2.push({st:m(a),point:data[a],dur:1.5,path:element.path,format:element.format})
                                        else {
                                            result2.push({st:m(mergedOP),point:Math.round(avg(data.slice(mergedOP,a))),dur:a-mergedOP+1.5,path:element.path,format:element.format})
                                            mergedOP = -1
                                        }
                                        return b
                                    })
                                    if(mergedOP!=-1)result2.push({st:m(mergedOP),point:Math.round(avg(data.slice(mergedOP,result[result.length-1]))),dur:result[result.length-1]-mergedOP+1.5,path:element.path,format:element.format})
                                }
                            }
                            that.tableData.push({
                                startLiveT: element.startLiveT,
                                format:element.format,
                                uname: element.uname,
                                name: element.name,
                                path: element.path,
                                qn: element.qn,
                                avgOnline: max(element.onlinesPerMin),
                                startT: element.startT,
                                druT: element.endT&&element.startT?((Date.parse(element.endT)-Date.parse(element.startT))/1000/60).toFixed(2)+"min":"",
                                hot: (result2.length>0?result2:undefined)
                            })
                        }
                    }
                    if(that.tableData.length>0){
                        that.defaultDateF = new Date(Date.parse(that.tableData[0].startT))
                    }
                    that.loopLoading = false
                    that.loadFileList()
                };

                let res = response.data
                if (res.code == 0)load(res.data)
                else console.error(res.message)
            })
        },
        onSubmit(){
            this.saveSearch()
            this.stopLoad = false
            this.tableData = []
            nextTick(this.loadFileList)
        },
        onReset(){
            this.form.sort = 'startTDsc'
            this.form.up = ''
            this.form.startDate = ''
            this.form.recDate = ''
            this.onSubmit()
        },
        hasContinue(){
            let para = new URL(window.location.href).searchParams.get("ref");
            para = para?para:""
            let save = localStorage.getItem("save")
            save = save?JSON.parse(save):{}
            this.hadSave = save[para]
        },
        onContinue(){
            let para = new URL(window.location.href).searchParams.get("ref");
            para = para?para:""
            let save = localStorage.getItem("save")
            save = save?JSON.parse(save):{}
            if(save[para]){
                let dur = save[para]["dur"]
                let st = save[para]["st"]
                let format = save[para]["format"]
                let ref = save[para]["ref"]
                window.open("player/?ref="+ref+"&format="+format+"&st="+st+(dur?"&dur="+dur:""))
                save[para] = undefined
                localStorage.setItem("save",JSON.stringify(save))
                this.hadSave = false
            }
        }
    },
    mounted() {
        this.hasContinue()
        this.getSearch()
        this.loadFileList()
        document.addEventListener("visibilitychange", ()=>{
            this.hasContinue()
        })
        window.addEventListener("resize", ()=>{
            document.querySelector("#table").style.height = "calc(100% - "+document.querySelector("#form").scrollHeight+"px)"
        })
        document.querySelector("#table").style.height = "calc(100% - "+document.querySelector("#form").scrollHeight+"px)"
    }
}
</script>

<template>
    <div style="height: calc(100vh - 20px);">
        <el-form 
            id="form" 
            :model="form" 
            label-width="auto" 
            :inline="true" 
            class="form-inline" 
            label-position="left" 
            size="small"
        >
            <el-form-item label="主播名" label-width="7em">
                <el-input v-model="form.up" placeholder="" clearable style="width:10em"/>
            </el-form-item>
            <el-form-item label="片段录制日期" label-width="7em">
                <el-date-picker
                    v-model="form.recDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    :default-value="defaultDateF"
                    style="width:10em"
                />
            </el-form-item>
            <el-form-item label="本场开始日期" label-width="7em">
                <el-date-picker
                    v-model="form.startDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    :default-value="defaultDateF"
                    style="width:10em"
                />
            </el-form-item>
            <el-form-item label="排序" label-width="3em">
                <el-select 
                    v-model="form.sort"
                    style="width:14em"
                    clearable
                >
                    <el-option
                        v-for="item in sortOption"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="" label-width="0em">
                <el-button @click="onSubmit">查询</el-button>
                <el-button @click="onReset">重置</el-button>
                <el-button id="continue" v-show="hadSave" @click="onContinue">继续上次</el-button>
            </el-form-item>
        </el-form>
        <el-table 
            id="table"
            @scroll="loadFileList"
            :data="tableData" 
            :table-layout="auto" 
            highlight-current-row
        >
            <el-table-column 
                label="标题" 
                min-width="300"
                show-overflow-tooltip
            >
                <template #default="scope">
                    <el-popover :width="500">
                        <template #reference>
                            <el-link @click.prevent="rowClick(scope.row)">
                                {{ scope.row.name }}
                            </el-link>
                        </template>
                        
                        <el-descriptions :size="small" border>
                            <el-descriptions-item label="文件夹">{{ scope.row.path }}</el-descriptions-item>
                        </el-descriptions>
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column label="主播名" prop="uname" min-width="200px"/>
            <el-table-column label="画质" prop="qn"/>
            <el-table-column label="观看人数" prop="avgOnline"/>
            <el-table-column label="录制时间" prop="startT" min-width="200px"/>
            <el-table-column label="录制时长" prop="druT" min-width="100px"/>
            <el-table-column label="本场开始时间" prop="startLiveT" min-width="200px"/>
            <el-table-column label="切片/模式" min-width="300px">
                <template #default="scope">
                    <div v-if="!scope.row.hot">
                        <el-space wrap>
                            <div>
                                <el-text>-</el-text>
                            </div>
                        </el-space>
                    </div>
                    <div v-if="scope.row.hot">
                        <el-space wrap>
                            <div v-for="tag in scope.row.hot">
                                <el-button size="small" plain @click.prevent="hotRowClick(tag)">
                                    {{ tag.st }}
                                    <span v-if="tag.point!=undefined">({{ tag.point }})</span>
                                </el-button>
                            </div>
                        </el-space>
                    </div>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<style>
    .form-inline .el-input,
    .form-inline .el-select
    {
        --el-input-width: 220px;
        --el-select-width: 220px;
    }

    .el-badge.item
    {
        margin-top: 11px;
    }
    #table .el-table__inner-wrapper
    {
        height:100%;
        overflow: auto;
    }

    .el-table__row
    {
        animation: 1s slide-in;
    }

    @keyframes slide-in {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }
</style>
