$base = 'http://localhost:3000'
Start-Sleep -Seconds 5

# Signup merchant
$merchantBody = @{ email = 'm1@example.com'; password = 'secret12'; role = 'merchant' } | ConvertTo-Json
$merchant = Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType 'application/json' -Body $merchantBody
$mt = $merchant.accessToken
Write-Output ("merchant token: $mt")

# Signup user
$userBody = @{ email = 'u1@example.com'; password = 'secret12'; role = 'user' } | ConvertTo-Json
$user = Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType 'application/json' -Body $userBody
$ut = $user.accessToken
Write-Output ("user token: $ut")

# Create product
$productBody = @{ name = 'Gift Card $50'; price = 50; availableUnits = 2 } | ConvertTo-Json
$product = Invoke-RestMethod -Method Post -Uri "$base/products" -Headers @{ Authorization = "Bearer $mt" } -ContentType 'application/json' -Body $productBody
$pid = $product.id
Write-Output ("product id: $pid")

# Deposit funds
$depBody = @{ amount = 100 } | ConvertTo-Json
$dep = Invoke-RestMethod -Method Post -Uri "$base/wallet/deposit" -Headers @{ Authorization = "Bearer $ut" } -ContentType 'application/json' -Body $depBody
Write-Output ($dep | ConvertTo-Json -Compress)

# Create wallet order
$orderBody = @{ productId = $pid; paymentMethod = 'wallet' } | ConvertTo-Json
$order = Invoke-RestMethod -Method Post -Uri "$base/orders" -Headers @{ Authorization = "Bearer $ut" } -ContentType 'application/json' -Body $orderBody
Write-Output ($order | ConvertTo-Json -Compress)
