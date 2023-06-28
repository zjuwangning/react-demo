# React Demo  v1.0.0

## 本地运行及编译打包
使用react-scripts插件 该插件已有完整的webpack配置文件 无需自己再编写构建脚本

### `npm start`
本地运行代码 执行完npm start后 打开[http://localhost:3000](http://localhost:3000)

### `npm run build`
打包命令 会将所有内容打包到build目录 包含完整系统运行所需内容 只需部署build目录


## 代码目录结构
所有需要修改的代码都在src中 public部分可以不管

###src目录如下:
```text
src
├─component         公共通用组件 例如tablepage 通用列表页面
│  └─tablepage
├─images            图片目录
├─layouts           主页面 包括登录页/跳转页/后台页
│  └─component      主页面用到的组件
├─pages             各个页面代码
│  ├─credentials    
│  │  ├─groups
│  │  └─users
│  ├─homepage
│  └─storage
│      ├─disks
│      └─pool
├─route             路由控制模块
├─server            通信模块
└─utils             额外功能
```


## 通信模块用法
使用pubsub-js插件做消息的订阅与发布
