#!/bin/bash

echo "=== Nginx代理问题快速诊断 ==="
echo

echo "1. 检查Nginx错误日志（最近10行）："
sudo tail -10 /var/log/nginx/error.log
echo

echo "2. 检查Nginx配置语法："
sudo nginx -t
echo

echo "3. 检查Nginx站点配置："
echo "查找包含 siqiongbiluo.love 的配置文件："
sudo grep -r "siqiongbiluo.love" /etc/nginx/sites-available/ /etc/nginx/sites-enabled/ 2>/dev/null
echo

echo "4. 检查9000端口监听状态："
sudo netstat -tlnp | grep :9000 || sudo ss -tlnp | grep :9000
echo

echo "5. 测试本地连接："
curl -s http://127.0.0.1:9000/api/categories | head -50
echo

echo "6. 检查防火墙状态："
sudo ufw status 2>/dev/null || echo "UFW not available"
echo

echo "诊断完成！请查看上述输出找出问题所在。" 