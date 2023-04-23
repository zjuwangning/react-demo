# Smart Store NAS  v1.0.0

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
│  ├─dashboard
│  └─storage
│      ├─disks
│      └─pool
├─route             路由控制模块
├─server            通信模块
└─utils             额外功能
```


## 通信模块用法
在页面打开就已经尝试创建了websocket链接  
使用pubsub-js插件做消息的订阅与发布 以实现socket通信  
使用时只需要从server目录下的index.js中引入websocket实例WebSocketService 以及 PubSub对象  
```js
import { WebSocketService } from '/server/index'
import PubSub from 'pubsub-js'


let Sub = null;         // 初始化订阅对象 用于创建及释放订阅
const uuid = getUUID(); // 生成uuid用于订阅功能
Sub = PubSub.subscribe(uuid, (_, result)=>{})   // 开启订阅 callback函数中进行订阅结果的处理 即接口返回的处理
WebSocketService.call(uuid, URL.LOGIN, {});     // call函数即接口的发送 传入uuid url params

PubSub.unsubscribe(Sub);        // 释放订阅 通常在组件销毁时 需要将所有订阅统一释放
```
