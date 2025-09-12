document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素引用对象
    // DOM 元素引用对象，用于存储页面中各个交互元素的引用
    const elements = {
        // 文件输入框，用户选择 CSV 文件时触发事件
        fileInput: document.getElementById('fileInput'),

        // 文件列表显示区域，展示已上传的文件信息
        fileList: document.getElementById('fileList'),

        // 上传按钮，用户点击后触发文件上传处理函数
        uploadBtn: document.getElementById('uploadButton'),

        // 状态显示区域，用于显示操作状态（如加载中、成功、错误等）
        status: document.getElementById('status'),

        // 数据选择下拉菜单，用户选择要显示的数据字段
        dataSelect: document.getElementById('dataSelect'),

        // 筛选字段选择下拉菜单，用户选择要筛选的字段
        filterField: document.getElementById('filterField'),

        // 筛选操作符选择下拉菜单，用户选择筛选条件的操作符（大于、小于或等于）
        filterOperator: document.getElementById('filterOperator'),

        // 筛选数值输入框，用户输入具体的数值作为筛选条件
        filterValue: document.getElementById('filterValue'),

        // 应用筛选按钮，用户点击后应用当前设置的筛选条件
        applyFilter: document.getElementById('applyFilter'),

        // 保存筛选结果按钮，用户点击后保存筛选后的数据为 CSV 文件
        saveFilter: document.getElementById('saveFilter'),

        // 第一个图表类型选择下拉菜单，用户选择第一个图表的类型（如柱状图、折线图等）
        chartType1: document.getElementById('chartType1'),

        // 第一个图表数据选择下拉菜单，用户选择第一个图表要显示的数据字段
        chartData1: document.getElementById('chartData1'),

        // 第二个图表类型选择下拉菜单，用户选择第二个图表的类型（如柱状图、折线图等）
        chartType2: document.getElementById('chartType2'),

        // 第二个图表数据选择下拉菜单，用户选择第二个图表要显示的数据字段
        chartData2: document.getElementById('chartData2')
    };

    /**
     * 图表实例存储对象
     * @type {Object}
     * @property {Chart|null} chart1 - 第一个图表实例
     * @property {Chart|null} chart2 - 第二个图表实例
     */
    let charts = {
        chart1: null,
        chart2: null
    };

    /**
     * 地图配置对象
     * @type {Object}
     * 知识点：高德地图瓦片URL的构成
     * - {s}: 服务器编号
     * - {x},{y}: 瓦片坐标
     * - {z}: 缩放级别
     */
    // 地图配置对象，定义地图的初始设置和图层信息
    const mapConfig = {
        // 地图中心点坐标，默认为中国地图中心点（经纬度）
        center: [35.8298, 104.7881], // 经纬度：[纬度, 经度]

        // 初始缩放级别，值越大表示地图越详细
        zoom: 4,

        // 定义地图图层配置，包括基础图层和卫星图层
        layers: {
            // 基础图层配置
            base: {
                // 图层瓦片URL模板，用于加载地图瓦片
                url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',

                // 图层选项配置
                options: {
                    // 子域名数组，用于负载均衡，分散请求到不同的服务器
                    subdomains: ["1", "2", "3", "4"],

                    // 版权声明，显示在地图上
                    attribution: '© 高德地图'
                }
            },

            // 卫星图层配置
            satellite: {
                // 卫星影像瓦片URL模板，用于加载卫星影像瓦片
                url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',

                // 卫星影像标注瓦片URL模板，用于加载卫星影像上的标注信息
                annotation: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
            }
        }
    };

        // 初始化地图图层
        // 创建基础图层，使用高德地图的基础瓦片URL和配置选项
    const baseLayer = L.tileLayer(mapConfig.layers.base.url, mapConfig.layers.base.options);
    // 创建卫星影像图层，使用高德地图的卫星影像瓦片URL，并复用基础图层的配置选项
    const satelliteLayer = L.tileLayer(mapConfig.layers.satellite.url, mapConfig.layers.base.options);
    // 创建卫星影像标注图层，使用高德地图的卫星影像标注瓦片URL，并复用基础图层的配置选项
    const annotationLayer = L.tileLayer(mapConfig.layers.satellite.annotation, mapConfig.layers.base.options);
    
    /**
     * 知识点：Leaflet图层组
     * LayerGroup允许将多个图层组合在一起，作为一个整体进行操作
     */
    const satelliteGroup = L.layerGroup([satelliteLayer, annotationLayer]);

    /**
     * 初始化地图实例
     * 知识点：Leaflet地图初始化参数
     * - center: 初始中心点
     * - zoom: 初始缩放级别
     * - layers: 初始图层
     * - zoomAnimation: 是否启用缩放动画
     */
    const map = L.map('map', {
        center: mapConfig.center,
        zoom: mapConfig.zoom,
        layers: [baseLayer],
        zoomAnimation: true
    });

    // 添加图层切换控件
    L.control.layers({
        "标准地图": baseLayer,
        "卫星影像": satelliteGroup
    }, null, {
        position: 'topright',
        collapsed: false
    }).addTo(map);

    // 添加比例尺控件
    L.control.scale({ imperial: false }).addTo(map);



    /**
     * 状态管理对象
     * @type {Object}
     * 知识点：状态管理
     * 集中管理应用的数据状态，便于数据的统一处理和更新
     */
    let state = {
        geoJson: null,        // GeoJSON数据
        csvFiles: [],         // 上传的CSV文件列表
        csvData: [],          // 解析后的CSV数据
        filteredData: [],     // 经过筛选的数据
        headers: [],          // CSV文件的表头
        selected: '',         // 当前选中的数据字段
        charts: {}           // 图表相关数据
    };

    /**
     * 创建信息控件
     * 知识点：Leaflet自定义控件
     * 通过继承L.Control创建自定义地图控件
     */
    // 创建信息控件实例
    const info = L.control();
    // 定义信息控件的 onAdd 方法
    info.onAdd = function () {
        // 创建一个 div 元素，并添加 'info' 类名
        this._div = L.DomUtil.create('div', 'info');
        // 调用 update 方法更新信息控件的内容
        this.update();
        // 返回创建的 div 元素，使其成为信息控件的内容
        return this._div;
    };
    
    // 更新信息控件内容的方法
    info.update = function (props, data) {
        // 初始化信息控件的内容，显示标题
        let content = '<h4><i class="fas fa-info-circle"></i> 城市数据信息</h4>';

        // 如果有属性和数据，则生成详细信息表格
        if (props && data) {
            // 构建表格，显示城市名称
            content += '<table>' +
                `<tr><td><i class="fas fa-city"></i> 城市</td><td>${data['城市']}</td></tr>` + // 显示城市名称，并使用 Font Awesome 图标（fa-city）

                // 遍历表头，生成表格行，显示其他字段的数据
                state.headers.map(header => {
                    // 跳过 "城市" 字段，避免重复显示
                    if (header === '城市') return '';

                    // 获取当前字段的值，如果为空则显示 "暂无数据"
                    const value = data[header] || '暂无数据';

                    // 根据字段名称选择合适的 Font Awesome 图标
                    const icon = header.includes('率') ? 'percentage' : 
                            header.includes('量') ? 'chart-line' : 'info';

                    // 返回表格行 HTML
                    return `<tr><td><i class="fas fa-${icon}"></i> ${header}</td><td>${value}</td></tr>`;
                }).join('') + // 将所有表格行连接成一个字符串

                '</table>'; // 结束表格标签
        } else {
            // 如果没有属性和数据，则提示用户鼠标悬停查看信息
            content += '<p><i class="fas fa-mouse-pointer"></i> 鼠标悬停在城市上查看信息</p>'; // 提示用户鼠标悬停查看信息，并使用 Font Awesome 图标（fa-mouse-pointer）
        }

        // 将生成的内容设置为信息控件的 HTML 内容
        this._div.innerHTML = content;
    };
    // 将信息控件添加到地图中
    info.addTo(map);

    /**
     * 颜色配置
     * 知识点：颜色渐变
     * 使用颜色数组创建从浅到深的渐变效果，用于表示数据的区间
     */
    const colors = ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'];

    /**
     * 工具函数集合
     * @namespace
     */
    const utils = {
        /**
         * 根据数值获取对应的颜色
         * @param {number} value - 数值
         * @param {Array<number>} ranges - 区间范围
         * @returns {string} 颜色值
         */
        getColor: (value, ranges) => {
            for (let i = ranges.length - 1; i >= 0; i--) {
                if (value >= ranges[i]) return colors[i];
            }
            return colors[0];
        },

        /**
         * 计算数据范围
         * 知识点：数据分段
         * 将数据均匀分成8个区间，用于创建图例
         */
        calculateRanges: data => {
            const values = data.map(d => parseFloat(d[state.selected])).filter(v => !isNaN(v));
            const min = Math.min(...values);
            const max = Math.max(...values);
            const step = (max - min) / 7;
            return Array.from({length: 8}, (_, i) => +(min + step * i).toFixed(2));
        },
        showStatus: (message, type) => {
            elements.status.textContent = message;
            elements.status.className = type;
            elements.status.style.display = 'block';
        },
        downloadCSV: (data, filename) => {
            const csv = [
                state.headers.join(','),
                ...data.map(row => state.headers.map(header => row[header]).join(','))
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        },
        createChart: (canvas, type, data, label) => {
            const ctx = canvas.getContext('2d');
            const chartData = {
                labels: data.map(d => d['城市']),
                datasets: [{
                    label: label,
                    data: data.map(d => parseFloat(d[label])),
                    backgroundColor: colors,
                    borderColor: type === 'line' ? colors[5] : colors,
                    borderWidth: 1
                }]
            };

            return new Chart(ctx, {
                type: type,
                data: chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: `${label}分布`
                        }
                    }
                }
            });
        }
    };

    /**
     * 创建图例
     * 知识点：自定义图例
     * 根据数据范围创建颜色图例，帮助用户理解数据分布
     */
    function createLegend(ranges) {
        if (window.legend) map.removeControl(window.legend);

        window.legend = L.control({position: 'bottomright'});
        window.legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML = `
                <h4><i class="fas fa-layer-group"></i> ${state.selected}</h4>
                ${ranges.slice(0, -1).map((from, i) => {
                    const to = ranges[i + 1];
                    const color = utils.getColor(from + 0.1, ranges);
                    return `
                        <div class="legend-item">
                            <i style="background-color: ${color}"></i>
                            <span>${from.toFixed(2)}${to ? ` - ${to.toFixed(2)}` : '+'}</span>
                        </div>`;
                }).join('')}
            `;
            return div;
        };
        window.legend.addTo(map);
    }

    /*中国以外区域点击出现北部湾大学出品文字弹窗*/     
    // 创建信息窗体内容
    function createInfoWindowContent(point) {
   // 调试路径
        console.log('Creating Popup Content for:', point.name);
        
        const content = `
            <div class="info-window">
                <h3>${point.name}</h3>
                <p>信息：北部湾大学出品</p> 
                <p>数据：非中华人民共和国区域，数据暂无</p>      
                <p>经度：${point.longitude}</p>
                <p>纬度：${point.latitude}</p>
            </div>
        `;
        return content;
    }   
    // 处理地图点击事件
    function handleMapClick(e) {
        // 检查点击位置是否在中国以内
        let isInsideChina = false;
        window.geojson.eachLayer(layer => {
            if (layer.getBounds().contains(e.latlng)) {
                isInsideChina = true;
            }
        });
        // 如果点击位置不在中国以内，则创建标记并绑定Popup
        if (!isInsideChina) {
            const marker = L.marker(e.latlng, {
                title: '点击位置'
            });

            const popupContent = createInfoWindowContent({
                name: '点击位置',
                longitude: e.latlng.lng,
                latitude: e.latlng.lat
            });

            marker.bindPopup(popupContent);
            marker.addTo(map);

            // 将标记添加到 state.markers 数组中
            state.markers.push(marker);
        }
    }
    // 为地图添加点击事件监听器
    map.on('click', handleMapClick);



         // 地图交互事件处理函数
        /*
         * 高亮显示地图要素
         * 当用户将鼠标悬停在某个区域上时触发此函数
         * @param {Event} e - 事件对象，包含触发事件的图层信息
         */
        function highlightFeature(e) {
            const layer = e.target; // 获取触发事件的图层（即当前鼠标悬停的区域）
            // 设置高亮样式
            layer.setStyle({
                weight: 3,          // 边框宽度增加到3px
                color: '#666',      // 边框颜色设置为深灰色
                dashArray: '',      // 移除虚线样式，改为实线
                fillOpacity: 0.8    // 填充透明度增加到0.8，使区域更显眼
            });
            // 将高亮的区域置于最前，确保其在其他图层之上显示
            layer.bringToFront();
            // 查找与当前区域名称匹配的数据记录
            const data = state.filteredData.find(d => d['城市'] === layer.feature.properties.name);
            // 更新信息控件的内容，显示该区域的详细信息
            info.update(layer.feature.properties, data);
        }
       /*
         * 重置地图要素样式
         * 当用户将鼠标移出某个区域时触发此函数
         * @param {Event} e - 事件对象，包含触发事件的图层信息
         */
        function resetHighlight(e) {
            // 恢复默认样式
            window.geojson.resetStyle(e.target); // 将图层样式恢复为原始状态

            // 清空信息控件的内容
            info.update();
        }
        /*
         * 缩放到地图要素
         * 当用户点击某个区域时触发此函数
         * @param {Event} e - 事件对象，包含触发事件的图层信息
         */
        function zoomToFeature(e) {
            // 调整地图视图以适应选中区域的边界
            map.fitBounds(e.target.getBounds());
        }

    // 更新地图
        function updateMap() {
        // 如果筛选后的数据为空或GeoJSON数据为空，则直接返回，不进行后续操作
        if (!state.filteredData.length || !state.geoJson) return;
        // 计算数据范围，用于创建颜色图例
        const ranges = utils.calculateRanges(state.filteredData);
        // 创建或更新图例
        createLegend(ranges);
        // 如果地图上已经存在GeoJSON图层，则先移除它
        if (window.geojson) map.removeLayer(window.geojson);
        // 创建新的GeoJSON图层，并将其添加到地图上
        window.geojson = L.geoJson(state.geoJson, {
            // 定义每个要素的样式
            style: feature => {
                // 根据城市名称在筛选后的数据中查找对应的数据
                const cityData = state.filteredData.find(d => d['城市'] === feature.properties.name);
                // 获取当前选中的数据字段的数值
                const value = cityData ? parseFloat(cityData[state.selected]) : 0;
                // 返回样式对象
                return {
                    weight: 2, // 边框宽度
                    opacity: 1, // 边框透明度
                    color: 'white', // 边框颜色
                    dashArray: '3', // 虚线样式
                    fillOpacity: 0.7, // 填充透明度
                    fillColor: utils.getColor(value, ranges) // 根据数值获取填充颜色
                };
            },
            // 对每个要素进行操作
            onEachFeature: (feature, layer) => {
                // 为每个要素添加鼠标事件监听器
                layer.on({
                    mouseover: highlightFeature, // 鼠标悬停时高亮要素
                    mouseout: resetHighlight, // 鼠标移出时重置要素样式
                    click: zoomToFeature // 点击要素时缩放到要素
                });
                // 为每个要素绑定Tooltip，显示城市名称
                layer.bindTooltip(feature.properties.name, {
                    direction: 'center', // Tooltip方向
                    permanent: false, // Tooltip是否永久显示
                    sticky: true, // Tooltip是否跟随鼠标
                    opacity: 0.9 // Tooltip透明度
                });
            }
        }).addTo(map); // 将GeoJSON图层添加到地图
        // 将GeoJSON图层置于最前
        window.geojson.bringToFront();    
    }
    
    // 更新图表
    function updateCharts() {
        // 更新第一个图表
        if (charts.chart1) charts.chart1.destroy();
        if (elements.chartData1.value) {
            charts.chart1 = utils.createChart(
                document.getElementById('chart1'),
                elements.chartType1.value,
                state.filteredData,
                elements.chartData1.value
            );
        }

        // 更新第二个图表
        if (charts.chart2) charts.chart2.destroy();
        if (elements.chartData2.value) {
            charts.chart2 = utils.createChart(
                document.getElementById('chart2'),
                elements.chartType2.value,
                state.filteredData,
                elements.chartData2.value
            );
        }
    }


    // 应用筛选条件到数据，并更新地图和图表
    /**
     * 应用筛选条件到数据
     * 根据用户选择的字段、操作符和数值筛选数据，并更新显示的地图和图表。
     */
    function applyFilter() {
        // 获取用户选择的筛选字段
        const field = elements.filterField.value;

        // 获取用户选择的操作符（大于、小于或等于）
        const operator = elements.filterOperator.value;

        // 将用户输入的筛选值转换为浮点数
        const value = parseFloat(elements.filterValue.value);

        // 如果没有选择字段或输入的筛选值不是有效的数字，则不进行筛选，直接使用原始数据
        if (!field || isNaN(value)) {
            state.filteredData = state.csvData; // 使用所有原始数据作为筛选后的数据
        } else {
            // 根据用户选择的字段、操作符和数值筛选数据
            state.filteredData = state.csvData.filter(item => {
                // 获取当前数据项中对应字段的值，并转换为浮点数
                const itemValue = parseFloat(item[field]);

                // 根据操作符进行条件判断
                switch (operator) {
                    case '>': 
                        return itemValue > value; // 返回大于指定值的数据项
                    case '<': 
                        return itemValue < value; // 返回小于指定值的数据项
                    case '=': 
                        return itemValue === value; // 返回等于指定值的数据项
                    default: 
                        return true; // 默认情况下返回所有数据项（即不筛选）
                }
            });
        }
        // 更新地图以反映新的筛选结果
        updateMap();
        // 更新图表以反映新的筛选结果
        updateCharts();
    }
    
    // 文件处理
    async function handleFileUpload() {
        try {
            utils.showStatus('正在加载地图数据...', 'loading');
            const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full_city.json');
            state.geoJson = await response.json();

            state.csvData = [];
            state.headers = [];

            // 处理所有上传的文件
// 遍历所有上传的 CSV 文件，逐个处理文件内容并解析为文本
            for (const file of state.csvFiles) {
                // 使用 Promise 和 FileReader 异步读取文件内容，并将其转换为文本格式
                const text = await new Promise((resolve) => {
                    // 创建一个新的 FileReader 实例用于读取文件
                    const reader = new FileReader();
                    
                    // 当文件读取完成时触发 onload 事件
                    // 将读取到的文件内容（作为字符串）传递给 resolve 函数，以完成 Promise
                    reader.onload = e => resolve(e.target.result);
                    
                    // 开始读取文件为文本格式
                    reader.readAsText(file);
                });


            // 将文件内容按行分割成数组，并去除首尾空白字符，确保每一行数据的整洁性
            const rows = text.trim().split('\n');

            // 获取表头（第一行），并去除每个字段中的空白字符，确保表头的整洁性
            const fileHeaders = rows[0].split(',').map(h => h.trim());

            // 检查文件是否包含 "城市" 列，如果不包含则抛出错误，提示用户该文件不符合要求
            if (!fileHeaders.includes('城市')) {
                throw new Error(`文件 ${file.name} 必须包含城市列`);
            }

            // 解析文件的每一行数据，从第二行开始（跳过表头）
            const fileData = rows.slice(1).map(row => {
                // 将每一行按逗号分割成数组，并去除每个字段中的空白字符，确保数据的准确性
                const values = row.split(',').map(v => v.trim());
                
                // 将每行数据转换为对象，键为表头，值为对应的字段值，便于后续处理和使用
                return Object.fromEntries(fileHeaders.map((h, i) => [h, values[i]]));
            });

            // 合并当前文件的数据到全局状态中，确保所有文件的数据都集中管理
            state.csvData = [...state.csvData, ...fileData];

            // 更新全局表头列表，确保不重复添加相同的表头，保持表头列表的唯一性
            state.headers = [...new Set([...state.headers, ...fileHeaders])];
            }

            // 更新选择框
            const dataHeaders = state.headers.filter(h => h !== '城市');
            elements.dataSelect.innerHTML = dataHeaders
                .map(h => `<option value="${h}">${h}</option>`)
                .join('');
            elements.filterField.innerHTML = `<option value="">选择字段</option>` + 
                dataHeaders.map(h => `<option value="${h}">${h}</option>`).join('');
            elements.chartData1.innerHTML = `<option value="">选择数据</option>` + 
                dataHeaders.map(h => `<option value="${h}">${h}</option>`).join('');
            elements.chartData2.innerHTML = `<option value="">选择数据</option>` + 
                dataHeaders.map(h => `<option value="${h}">${h}</option>`).join('');
            
            state.selected = elements.dataSelect.value;
            state.filteredData = state.csvData;
            
            updateMap();
            utils.showStatus('数据加载完成！请将鼠标悬停在地图上查看详细信息。', 'success');
        } catch (error) {
            utils.showStatus(error.message, 'error');
            console.error('数据加载失败:', error);
        }
    }

    // 更新文件列表
    function updateFileList() {
        elements.fileList.innerHTML = state.csvFiles.map((file, index) => `
            <li class="file-item">
                <span>${file.name}</span>
                <button onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `).join('');
        
        elements.uploadBtn.disabled = state.csvFiles.length === 0;
    }

    // 删除文件
    window.removeFile = function(index) {
        state.csvFiles.splice(index, 1);
        updateFileList();
    };

    // 事件监听
        // 为文件输入元素添加事件监听器，当用户选择文件时触发
    elements.fileInput.addEventListener('change', () => {
        // 将新选择的文件添加到已有的 CSV 文件列表中
        state.csvFiles = [...state.csvFiles, ...Array.from(elements.fileInput.files)];
        // 清空文件输入框的值，以便用户可以再次选择文件
        elements.fileInput.value = '';
        // 更新文件列表显示
        updateFileList();
    });

    // 为上传按钮添加点击事件监听器，当用户点击上传按钮时触发文件上传处理函数
    elements.uploadBtn.addEventListener('click', handleFileUpload);

    // 为数据选择下拉菜单添加事件监听器，当用户选择不同的数据源时更新地图
    elements.dataSelect.addEventListener('change', e => {
        // 更新当前选中的数据源
        state.selected = e.target.value;
        // 根据选中的数据源更新地图
        updateMap();
    });

    // 为应用筛选按钮添加点击事件监听器，当用户点击应用筛选按钮时执行筛选逻辑
    elements.applyFilter.addEventListener('click', applyFilter);

    // 为保存筛选结果按钮添加点击事件监听器，当用户点击保存按钮时下载筛选后的数据
    elements.saveFilter.addEventListener('click', () => {
        // 下载筛选后的数据为 CSV 文件，文件名为 'filtered_data.csv'
        utils.downloadCSV(state.filteredData, 'filtered_data.csv');
    });

    // 为图表类型和数据选择下拉菜单添加事件监听器，当用户更改图表类型或数据源时更新图表
    elements.chartType1.addEventListener('change', updateCharts);
    elements.chartData1.addEventListener('change', updateCharts);
    elements.chartType2.addEventListener('change', updateCharts);
    elements.chartData2.addEventListener('change', updateCharts);

    // 为地图的基础图层变化事件添加监听器，当基础图层发生变化时将 GeoJSON 图层置于最前
    map.on('baselayerchange', () => {
        // 如果存在 GeoJSON 图层，则将其置于最前
        if (window.geojson) window.geojson.bringToFront();
    });
});

