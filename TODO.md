# TODO

-[x] 进入 app 之后是跳转到相机界面的而不是展示相机界面 please fix
-[x] 设置 guest 模式，
3. 注册和登录功能，刚进入 app 时一个注册屏幕: login with email, apple oauth, continue as guest(在未登录时也可以使用)
-[x] /camera 相册放在拍照键右侧，设置放在右上，底部增加历史（白噪音 app scene 的 UIUX）
-[x] 修改 logo 大小，更小一点，留白；然后删除 logo 底部的三个按钮，只保留中间的大头钉
-[x] expo av deprecated, use expo-audio and expo-video
1. fix unsupported country/region for openai, 根据地区使用国产模型
2. 实现每个按钮的功能：“换一种讲法” 等 /lecture 页面的按钮
-[x] 移除右上角 80% 的 confidence 的按钮，绿色带对勾的
1.  加速 /identify 接口
-[ ] /identify 接口有时候随便拍会generate json failed，处理常见情况如随便拍了一个桌面的照片
1.  /identify 接口修改为持续识别，最好能做到 2s 就能识别一次
-[x] Build android