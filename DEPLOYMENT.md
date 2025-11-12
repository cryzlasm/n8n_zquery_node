# 部署和测试指南

## 部署步骤

1. 确保已安装 zq 命令行工具：
   ```bash
   zq --version
   ```
   如果未安装，请根据您的操作系统安装：
   - macOS: `brew install brimdata/tap/zq`
   - 其他系统: 从 https://github.com/brimdata/zq/releases 下载

2. 安装项目依赖：
   ```bash
   npm install
   ```

3. 构建项目：
   ```bash
   npm run build
   ```

4. 将整个目录复制到 n8n 的自定义节点目录中：
   ```bash
   # 通常在 ~/.n8n/custom/ 目录下
   cp -r /path/to/n8n_json_zquery ~/.n8n/custom/
   ```

5. 重启 n8n 服务

## 测试步骤

1. 在 n8n 中创建新工作流
2. 添加 "ZQuery JSON Input" 节点
3. 使用以下测试数据：

   JSON Data:
   ```json
   [
     {"id": 1, "name": "John", "age": 30, "department": "Engineering"},
     {"id": 2, "name": "Jane", "age": 25, "department": "Marketing"},
     {"id": 3, "name": "Bob", "age": 35, "department": "Engineering"}
   ]
   ```

   ZQuery:
   ```
   filter department == "Engineering" | cut id,name,age
   ```

4. 执行节点，应该得到以下输出：
   ```json
   [
     {"id": 1, "name": "John", "age": 30},
     {"id": 3, "name": "Bob", "age": 35}
   ]
   ```

## 常见问题排查

1. 如果遇到 "zq command not found" 错误：
   - 确认 zq 已正确安装
   - 检查 zq 是否在系统 PATH 中
   - 重启终端或 n8n 服务

2. 如果节点不显示在 n8n 中：
   - 检查节点目录结构是否正确
   - 确认 package.json 和 dist/ 目录存在
   - 查看 n8n 启动日志中的错误信息

3. 如果遇到上下文绑定错误：
   - 确保使用的是最新版本的节点代码
   - 重新构建项目并重启 n8n