# 解除 Fork：新建同名仓库并迁回代码

GitHub 上 **删除仓库、新建空仓库** 只能你在网页上操作，本机脚本只负责 **备份镜像** 与 **推回**。

## 第一步：本机已生成 bare 镜像（或自行执行）

在 `D:\CODE` 下应存在 `life-blog-bare.git`（`git clone --bare` 产物）。若没有，执行：

```powershell
cd D:\CODE
git clone --bare https://github.com/violet-summer/life-blog.git life-blog-bare.git
```

## 第二步：在 GitHub 网页上操作（必须按顺序）

1. 打开 <https://github.com/violet-summer/life-blog/settings> → 最下方 **Danger Zone** → **Delete this repository**，按提示删除（会丢失该仓库上的 Issues、PR、星标等，请先确认）。
2. 新建仓库：<https://github.com/new>
   - **Repository name**：`life-blog`（与原来相同）
   - **不要**勾选 “Add a README” / .gitignore / license（保持完全空仓库）
   - **不要**使用 Fork，用普通 **Create repository**

## 第三步：把镜像推回新仓库

在 PowerShell 中执行（将 URL 换成你的，若用 SSH 则改为 `git@github.com:violet-summer/life-blog.git`）：

```powershell
cd D:\CODE\life-blog-bare.git
git push --mirror https://github.com/violet-summer/life-blog.git
```

首次推送可能需要登录 GitHub（浏览器或 Personal Access Token）。

### 若 `git push` 退出码 128

常见原因：

1. **HTTPS 未登录**：在凭据管理器里删掉旧的 `github.com` 凭据后重试，或在提示密码时填入 **Personal Access Token**（`repo` 权限），不要用账户登录密码。
2. **新仓库不是空的**：新建时勾了 README / license 会导致拒绝；需删掉仓库再建一个完全空的，或改用 `git push --mirror --force`（慎用）。
3. **仓库名或账号不对**：确认 URL 是 `https://github.com/violet-summer/life-blog.git`。
4. **改用 SSH**：本机已配置 `ssh-key` 时可用  
   `git push --mirror git@github.com:violet-summer/life-blog.git`

脚本已改为英文提示、避免乱码；可带参数跳过确认：  
`.\scripts\mirror-push-after-recreate.ps1 -SkipPrompt`

## 第四步：清理本机工作区（可选）

1. 推送成功后，可删除备份目录：`Remove-Item -Recurse -Force D:\CODE\life-blog-bare.git`
2. 在现有项目 `D:\CODE\life-blog` 中删除已不再需要的上游远程：

```powershell
cd D:\CODE\life-blog
git remote remove upstream
```

3. 验证：`git fetch origin` 与 `git status` 应正常。

## 第五步：GitHub Pages / Actions

若使用同一仓库名与同一账号，一般 **Pages、Actions 配置会随仓库删除而清空**，推送完成后请在 **Settings → Pages** 里重新选择 **GitHub Actions** 等。
