<script>
import Axios from 'axios'
import { setupCache } from 'axios-cache-interceptor';

export default {
    data() {
        return {
            search: "",
            loading: true,
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
            console.log(data)
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
            window.open("player/?ref="+data.path+(data.format?"&format="+data.format:""))
        },
        hotRowClick(data) {
            window.open("player/?ref="+data.path+(data.format?"&format="+data.format:"")+"&st="+data.st+"m&dur="+data.dur+"m")
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
    },
    mounted() {
        const instance = Axios.create();
        const axios = setupCache(instance);
        let that = this
        axios.get('filePath')
            .then(function (response) {
                const sleep = ms => new Promise(r => setTimeout(r, ms));
                const load = async (data) => {
                    for (let index = 0; data && index < data.length; index++) {
                        const element = data[index]
                        
                        let result2 = []
                        await axios.get('danmuCountPerMin?ref='+element.path)
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
                            let c = false
                            let s = 0
                            let ss = 0
                            let m = a => a>0.5?a-0.5:a
                            if(result.length==1)result2.push({st:m(result[0]),dur:1.5,path:element.path,format:element.format})
                            else result.reduce((a,b)=>{
                                if(a!=b-1){
                                    if(c){
                                        result2.push({st:m(s),dur:ss+0.5,path:element.path,format:element.format})
                                        c = false
                                        ss = 0
                                    } else result2.push({st:m(a),dur:1.5,path:element.path,format:element.format})
                                } else {
                                    if(!c)s = a
                                    c = true
                                    ss += 1
                                }
                                return b
                            })
                        })
                        .finally(()=>{
                            if(result2.length>0)that.tableData.push({
                                startLiveT: element.startLiveT,
                                format:element.format,
                                uname: element.uname,
                                name: element.name,
                                path: element.path,
                                qn: element.qn,
                                avgOnline: max(element.onlinesPerMin),
                                startT: element.startT,
                                hot: result2
                            })
                            else {
                                that.tableData.push({
                                    startLiveT: element.startLiveT,
                                    format:element.format,
                                    uname: element.uname,
                                    name: element.name,
                                    path: element.path,
                                    qn: element.qn,
                                    avgOnline: max(element.onlinesPerMin),
                                    startT: element.startT
                                })
                            }
                        })
                    }
                };

                let res = response.data
                let max = array => (array&&array.length>0)?Math.round(array.reduce((a,b)=>a>b?a:b)):0;
                if (res.code == 0)load(res.data)
                else console.error(res.message)
            })
            .then(function (params) {
                setTimeout(()=>{
                    that.loading = false
                },300)
            })
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
                        height="90vh" 
                        :data="filterTableData" 
                        :table-layout="auto" 
                        highlight-current-row
                        :default-sort="{ prop: 'startT', order: 'descending' }"
                    >
                        <el-table-column 
                            label="标题" 
                            min-width="300"
                            show-overflow-tooltip
                        >
                            <template #default="scope">
                                <el-link @click.prevent="rowClick(scope.row)">{{ scope.row.name }}</el-link>
                            </template>
                        </el-table-column>
                        <el-table-column label="主播名" prop="uname" min-width="200px"/>
                        <el-table-column label="画质" prop="qn"/>
                        <el-table-column label="观看人数" prop="avgOnline"/>
                        <el-table-column label="录制时间" prop="startT" min-width="200px"/>
                        <el-table-column label="本场开始时间" prop="startLiveT" min-width="200px"/>
                        <el-table-column label="切片" min-width="300px">
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
                                            <el-button size="small" plain @click.prevent="hotRowClick(tag)">{{ tag.st }}</el-button>
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