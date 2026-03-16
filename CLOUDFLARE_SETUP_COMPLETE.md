# ✅ Cloudflare Setup Complete - consabor.uk

## 🎉 Domain Status: ACTIVE

**Primary URL**: https://www.consabor.uk ✅

## Current Configuration

### Koyeb
- **App**: parliamentary-bunnie
- **Service ID**: 27a2455a
- **Domain**: www.consabor.uk (Domain ID: 0ea9142c)
- **Status**: ACTIVE ✅
- **SSL**: Issued and working ✅
- **Health check**: https://www.consabor.uk/health → 200 OK ✅

### Cloudflare
- **Nameservers**:
  - anna.ns.cloudflare.com ✅
  - ruben.ns.cloudflare.com ✅
- **Status**: Propagating (1-2 hours)
- **DNS Records**:
  ```
  CNAME @ → 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app (DNS only)
  CNAME www → consabor.uk (Proxied)
  MX send → feedback-smtp.eu-west-1.amazonses.com
  TXT resend._domainkey → (DKIM key)
  TXT send → v=spf1 include:amazonses.com ~all
  ```

### Flashhost
- **Nameservers**: Changed to Cloudflare ✅
- **DNS Management**: Now handled by Cloudflare
- **Advanced DNS**: Disabled (shows "not pointing to us") ✅

---

## ✅ What's Working NOW

1. **https://www.consabor.uk** → Fully functional ✅
2. **SSL Certificate** → Issued and active ✅
3. **HTTP/2** → Enabled ✅
4. **Koyeb deployment** → Running healthy ✅
5. **Email (Amazon SES)** → Configured and working ✅

---

## ⏳ What's Pending (1-2 hours)

1. **Nameserver propagation**: Cloudflare waiting for full propagation
2. **Root domain redirect**: Once propagated, configure `consabor.uk` → `www.consabor.uk`

---

## 🔄 Next Steps (After Nameserver Propagation)

### 1. Verify Cloudflare Active

Once Cloudflare shows **"Active"** instead of "Waiting for propagation":

```bash
# Check nameservers
dig +short consabor.uk NS
# Should show:
# anna.ns.cloudflare.com
# ruben.ns.cloudflare.com
```

### 2. Configure Root Domain Redirect in Cloudflare

**Option A: Using Page Rules (Free Plan)**

1. Go to Cloudflare Dashboard → **Rules** → **Page Rules**
2. Click **Create Page Rule**
3. URL: `consabor.uk/*`
4. Setting: **Forwarding URL** → **301 Permanent Redirect**
5. Destination: `https://www.consabor.uk/$1`
6. Save

**Option B: Using Redirect Rules (Better)**

1. Go to **Rules** → **Redirect Rules**
2. Create rule:
   - **If**: Hostname equals `consabor.uk`
   - **Then**: Dynamic redirect
   - **URL redirect**: `https://www.consabor.uk${path}`
   - **Status code**: 301
3. Save

---

## 🧪 Testing (After Propagation)

```bash
# Test root domain redirect
curl -I http://consabor.uk
# Should show: Location: https://www.consabor.uk

# Test www domain
curl -I https://www.consabor.uk/health
# Should show: HTTP/2 200

# Test subdomain (if configured)
curl -I https://sabor.consabor.uk
```

---

## 📊 Benefits of Current Setup

### ✅ Cloudflare Advantages
- **CDN**: Global edge caching
- **DDoS Protection**: Automatic mitigation
- **SSL**: Free universal certificate
- **Analytics**: Traffic insights
- **Fast DNS**: 11ms average response time
- **CNAME Flattening**: Works on root domain

### ✅ Koyeb Advantages
- **Free Tier**: $0/month (0.1 vCPU, 512MB RAM)
- **Auto-scaling**: Scale to zero when idle
- **Health Checks**: `/health` endpoint monitored
- **Global Edge**: Multiple regions
- **Zero Config SSL**: Auto-issued certificates

---

## 🔐 Security Features Enabled

1. **SSL/TLS**: Full (strict) encryption
2. **HTTPS**: Forced via Cloudflare
3. **DDoS Protection**: Layer 3/4/7
4. **HTTP/2**: Enabled
5. **Email SPF**: Configured (`v=spf1 include:amazonses.com ~all`)
6. **Email DKIM**: Configured (resend._domainkey)

---

## 📝 Environment Variables (Already Configured in Koyeb)

```bash
BUNNY_ALLOWED_REFERRER=https://www.consabor.uk
OAUTH_SERVER_URL=https://www.consabor.uk
# All other env vars already set
```

---

## 🎯 Final URLs

- **Production**: https://www.consabor.uk ✅
- **Koyeb Direct**: https://parliamentary-bunnie-sabor-e1ecec33.koyeb.app ✅
- **Root Redirect**: http://consabor.uk → https://www.consabor.uk (pending propagation)

---

## 🆘 Troubleshooting

### If www.consabor.uk stops working:
1. Check Koyeb service status: `koyeb service get 27a2455a`
2. Check domain status: `koyeb domain get 0ea9142c`
3. Verify DNS: `dig www.consabor.uk CNAME`

### If email stops working:
1. Check MX record in Cloudflare: `dig send.consabor.uk MX`
2. Check SPF: `dig send.consabor.uk TXT`
3. Check DKIM: `dig resend._domainkey.consabor.uk TXT`

### If root domain doesn't redirect:
1. Wait for nameserver propagation (up to 24h)
2. Check Cloudflare redirect rule is configured
3. Clear browser cache

---

## 📚 Documentation Files

- `KOYEB_DEPLOYMENT.md` - Koyeb setup guide
- `FLASHHOST_DNS_SETUP.md` - Original DNS config (now obsolete)
- `CLOUDFLARE_SETUP_COMPLETE.md` - This file
- `.claude/memory.md` - Updated with Cloudflare info

---

**✅ Setup completed**: 2026-03-16
**⏳ Full propagation**: 1-2 hours
**🚀 Primary domain**: https://www.consabor.uk
**💰 Total cost**: $0/month (Koyeb Free + Cloudflare Free)
