## react v18 

### useEffect用法
```js
//最简单用法
useEffect(() => {
    //只有方法体，相当于componentDidMount和componentDidUpdate中的代码
    document.title = count;
})

//加返回值用法
useEffect(() => {
    //添加监听事件，相当于componentDidMount和componentDidUpdate中的代码
    window.addEventListener('resize', onChange, false);
    //返回的函数用于解绑事件，相当于componentWillUnmount中的代码
    return () => {
        window.removeEventListener('resize', onChange, false)
    }
})

//加空数组参数用法
useEffect(() => {
    // 相当于 componentDidMount
    window.addEventListener('resize', onChange, false)
    return () => {
        // 相当于 componentWillUnmount
        window.removeEventListener('resize', onChange, false)
    }
}, []);

//加监听值用法
useEffect(() => {
    //只有当count的值发生变化，此函数才会执行
    console.log(`count change: count is ${count}`)
}, [ count ]);
```





