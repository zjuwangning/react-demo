## react-router-dom v6 几个重要更新

### 移除了 Switch 组件，改用 Routes 组件
```js
<BrowserRouter>
    <Routes>
        <Route path="/index" exact={true} element={<HomePage />}/>
    </Routes>
</BrowserRouter>
```

### 跳转
+ 通过 Link 组件跳转
```js
<Link to={'/homepage'}>To HomePage</Link>
```
+ 通过 useNavigate 方法跳转
```js
const navigate = useNavigate();
const toHomepage = () => {
    navigate('/homepage');
}
```

### 移除了 Redirect 组件，改用 Navigate 组件
```js
<BrowserRouter>
    <Routes>
        <Route path="/" exact={true} element={<Navigate to={'/index'}/>}/>
        <Route path="/index" exact={true} element={<HomePage />}/>
    </Routes>
</BrowserRouter>
```

### 嵌套路由
1. 嵌套路由的 path 可以不用写父级，会直接拼接
2. 嵌套路由 Route 的 index 属性就是用来展示默认子路由的
3. 嵌套路由必须在父级追加 Outlet 组件，作为子级组件的占位符，类似于 vue-router 中的 router-view
```js
// https://blog.csdn.net/weixin_44051815/article/details/121413076
```

### 动态路由
1. 动态路由通过 :style 的形式实现
2. useParams 获取动态路由的值  useSearchParams 获取查询字符串的值

### 通过配置实现路由管理
useRoutes 可以将数组对象形式的路由，直接在页面上使用
```js
// 详见 route.config.js
```



