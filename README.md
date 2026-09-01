# SUNRISE STEEL 外贸网站 — 部署指南（新手版）

这是一个纯手写的钢材外贸 B2B 展示网站，包含：

| 文件 | 作用 |
|------|------|
| `index.html` | 网站页面（产品展示、规格表、询价表单、FAQ） |
| `styles.css` | 全部样式（已适配手机/平板/电脑） |
| `script.js` | 表单提交逻辑、移动端菜单、防垃圾机制 |
| `api/rfq.js` | 询价转发后端（Vercel 云函数，把客户询价发到你邮箱） |
| `README.md` | 本指南 |

---

## 第一步：把代码传到 GitHub（10 分钟）

1. 打开 [github.com](https://github.com)，注册一个免费账号并登录。
2. 点右上角 **+** → **New repository**：
   - Repository name 填 `steel-website`（名字随意）
   - 选择 **Private**（私有，别人看不到）
   - 勾选 **Add a README file**
   - 点 **Create repository**
3. 进入刚建好的仓库页面，点上方 **Add file** → **Upload files**。
4. 把本文件夹里的 **4 个文件/文件夹** 拖进去：
   - `index.html`
   - `styles.css`
   - `script.js`
   - `api` 文件夹（里面是 `rfq.js`）
   - （`README.md` 可以不传，仓库里已自动建了一个）
5. 拖拽时 GitHub 会保留 `api/` 的文件夹结构，**必须保留**，不能把 `rfq.js` 拖到根目录。
6. 点下方绿色的 **Commit changes** 按钮，完成上传。

> 全程不需要安装任何软件，只用浏览器操作。

---

## 第二步：部署到 Vercel，拿到免费域名（5 分钟）

1. 打开 [vercel.com](https://vercel.com)，点 **Sign Up** → 选择 **Continue with GitHub**（用刚才的 GitHub 账号登录，会请求授权，点同意）。
2. 登录后点 **Add New…** → **Project**。
3. 在列表里找到 `steel-website` 仓库，点右侧 **Import**。
4. 配置页面**什么都不用改**（Vercel 会自动识别），直接点 **Deploy**。
5. 等待约 1 分钟，出现 "Congratulations" 就成功了。
6. 点击 **Continue to Dashboard** → **Visit**，即可看到你的网站。
   - 免费域名格式为 `steel-website-xxxx.vercel.app`，任何人都能访问。

---

## 第三步：配置询价表单，让客户询价发到你邮箱（10 分钟）

网站已经可以访问，但询价表单需要再配一个免费的发信服务（Resend），询价才能转到你的邮箱。不配置也能用——表单会自动降级为打开客户的邮件客户端给你写信。

1. 打开 [resend.com](https://resend.com)，注册免费账号（免费额度：每天 100 封，够用）。
2. 登录后点左侧 **API Keys** → **Create API Key**，名字随意，权限保持默认，点创建。
3. **复制生成的密钥**（以 `re_` 开头，只显示一次）。
4. 回到 Vercel 网站，进入你的项目 → 顶部 **Settings** 标签 → 左侧 **Environment Variables**。
5. 添加两个变量：

   | Name | Value |
   |------|-------|
   | `RESEND_API_KEY` | 刚才复制的 `re_` 开头的密钥 |
   | `OWNER_EMAIL` | 你的收件邮箱，如 `sales@yourcompany.com` |

6. 点 **Save** 保存。
7. 回到 **Deployments** 标签，找到最新的那条部署记录，点右侧 **…** 菜单 → **Redeploy** 重新部署一次（让新变量生效）。
8. 测试：打开你的网站，填写询价表单提交，几秒后你的邮箱（含垃圾邮件文件夹）应收到一封 "RFQ: …" 邮件，直接回复即可联系买家。

> 说明：免费版 Resend 用 `onboarding@resend.dev` 作为发件人，收到的邮件显示由系统代发，"回复"会直接发给买家本人，不影响使用。以后有自己的域名后可绑定域名改发件人。

---

## 第四步：把示例内容换成你公司的真实信息

网站目前用的是虚构的 "SUNRISE STEEL" 示例内容。需要修改的地方都在
`index.html` 里，用记事本（或 VS Code）打开，**查找替换**以下内容：

| 查找 | 替换为 |
|------|--------|
| `Sunrise Steel Co., Ltd.` / `SUNRISE STEEL` | 你的公司英文名 |
| `sales@sunrisesteel.example.com` | 你的真实邮箱 |
| `+86 138-0000-0000` / `8613800000000` | 你的 WhatsApp 号码 |
| 地址、年份、产能数据（如 `12 production lines`、`60+ countries`） | 真实数据 |
| 六个产品卡片的名称和规格 | 你的实际产品 |

`script.js` 第 11 行的 `OWNER_EMAIL` 也要改成你的真实邮箱（这是邮件降级兜底用的）。

改完后回到 GitHub 仓库 → **Add file** → **Upload files**，把改过的文件重新拖进去提交，
Vercel 会在 1 分钟内自动更新网站。**这就是以后改网站内容的固定流程：改文件 → 传 GitHub → 自动上线。**

---

## 常见问题

- **手机上打开正常吗？** 正常。网站已做手机适配，手机底部有固定的 "Get a Quote / WhatsApp / Email" 按钮栏。
- **想用自己买的域名？** 在 Vercel 项目 → Settings → Domains 里添加，按提示去域名服务商改一条 DNS 记录即可（.com 域名约 ¥60/年）。
- **询价没收到邮件？** 先查垃圾邮件文件夹；再检查 Vercel 环境变量是否配置正确、是否 Redeploy 过；Resend 免费版每天限 100 封。
- **想改配色？** 打开 `styles.css`，改最上方 `:root` 里的 `--accent`（橙色）和 `--navy`（深蓝）两个颜色值即可。
