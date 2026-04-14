$path = "d:\my new one\my-win-main"
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()

Write-Host "Server started at http://localhost:8080/"

try {
    while($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $file = $request.Url.LocalPath.Replace("/", "\")
        if ($file -eq "\") { $file = "\login.html" }
        
        $fullPath = Join-Path $path $file
        
        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            
            # Simple MIME mapping
            if ($fullPath.EndsWith(".html")) { $response.ContentType = "text/html" }
            elseif ($fullPath.EndsWith(".css")) { $response.ContentType = "text/css" }
            elseif ($fullPath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
