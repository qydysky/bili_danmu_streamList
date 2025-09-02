<script>
import Axios from 'axios'
import { setupCache } from 'axios-cache-interceptor';
export default {
    data() {
        return {
            search: "",
            loading: true,
            loopLoading: false,
            disabledLoadFileList: false,
            tableData: []
        }
    },
    computed: {
        loading: {
            get() {
                return this.loading
            },
            set(loading) {
                this.loading = loading
            }
        },
        filterTableData() {
            let data = this.tableData.sort((a,b)=>{
                if(a.startT>b.startT)return 1
                if(a.startT==b.startT)return 0
                if(a.startT<b.startT)return -1
            })
            return data
        },
        search: {
            get() {
                return this.search
            },
            set(value) {
                this.search = value
            }
        }
    },
    methods: {
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
        loadFileList(el){
            if(this.loopLoading || this.disabledLoadFileList)return console.log("skip")
            this.loopLoading = true
            let that = this
            const axios = setupCache(Axios.create());
            let para = new URL(window.location.href).searchParams;
            
            axios.get('filePath?size=10&ref='+(para.has("ref")?para.get("ref"):"")+'&skip='+this.tableData.length)
            .then(function (response) {
                const load = async (data) => {
                    that.disabledLoadFileList = !data || data.length < 10
                    for (let index = 0; data && index < data.length; index++) {
                        const element = data[index]
                        let result2 = []
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
                            await axios.get('danmuCountPerMin?ref='+(para.has("ref")?para.get("ref"):"")+element.path)
                            .then(function (response) {
                                if(!response || response.length==0 || !response.data || response.data.length==0)return
                                let avg = array => (array&&array.length>0)?(array.reduce((a,b)=>a+b)/array.length):0;
                                let avgC = avg(response.data) 
                                let result = []
                                response.data.forEach((v,k)=>{
                                    if(v>=avgC*1.5){
                                        result.push(k)
                                    }
                                })
                                if(result.length==0)return
                                let mergedOP = -1
                                let m = a => a>0.5?a-0.5:a
                                if(result.length==1)result2.push({st:m(result[0]),point:response.data[result[0]],dur:1.5,path:element.path,format:element.format})
                                else {
                                    result.reduce((a,b)=>{
                                        if(b-a<2){
                                            if(mergedOP==-1)mergedOP = a
                                        } else if(mergedOP==-1)result2.push({st:m(a),point:response.data[a],dur:1.5,path:element.path,format:element.format})
                                        else {
                                            result2.push({st:m(mergedOP),point:Math.round(avg(response.data.slice(mergedOP,a))),dur:a-mergedOP+1.5,path:element.path,format:element.format})
                                            mergedOP = -1
                                        }
                                        return b
                                    })
                                    if(mergedOP!=-1)result2.push({st:m(mergedOP),point:Math.round(avg(response.data.slice(mergedOP,result[result.length-1]))),dur:result[result.length-1]-mergedOP+1.5,path:element.path,format:element.format})
                                }
                            })
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
                        }
                    }
                    that.loopLoading = false
                    el.scrollFn()
                };

                let res = response.data
                let max = array => (array&&array.length>0)?Math.round(array.reduce((a,b)=>a>b?a:b)):0;
                if (res.code == 0)load(res.data)
                else console.error(res.message)
            })
        }
    },
    mounted() {
        setTimeout(()=>{
            this.loading = false
        },300)
    }
}

</script>

<template>
    <el-row>
        <el-col :span="24">
            <el-skeleton :loading="loading" animated>
                <template #template>
                    <el-skeleton :rows="5" animated></el-skeleton>
                </template>
                <template #default>
                    <el-table 
                        v-vTablescroll="loadFileList"
                        :data="filterTableData" 
                        :table-layout="auto" 
                        highlight-current-row
                        :default-sort="{ prop: 'startT', order: 'descending' }"
                        style="height:90vh; overflow: auto"
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
                </template>
            </el-skeleton>
        </el-col>
    </el-row>
</template>

<style scoped>
    .el-badge.item {
    margin-top: 11px;
    }
</style>
