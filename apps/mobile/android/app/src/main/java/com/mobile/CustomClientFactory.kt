package com.mezon.mobile

import android.util.Log
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.ReactCookieJarContainer
import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import javax.net.ssl.*
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

class CustomClientFactory : OkHttpClientFactory {
    companion object {
        private const val TAG = "OkHttpClientFactory"
    }

    override fun createNewNetworkModuleClient(): OkHttpClient {
        return try {
            val trustAllCerts = arrayOf<TrustManager>(
                object : X509TrustManager {
                    override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
                        Log.e("ECD", "Burada 2")
                    }

                    override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
                        Log.e("ECD", "Burada 1")
                    }

                    override fun getAcceptedIssuers(): Array<X509Certificate> {
                        Log.e("ECD", "Burada 3")
                        return arrayOf()
                    }
                }
            )

            // Cài đặt trust manager
            val sslContext = SSLContext.getInstance("SSL").apply {
                init(null, trustAllCerts, SecureRandom())
            }
            val sslSocketFactory = sslContext.socketFactory

            SSLContext.getInstance("SSL").apply {
                init(null, trustAllCerts, SecureRandom())
                HttpsURLConnection.setDefaultSSLSocketFactory(socketFactory)
            }

            HttpsURLConnection.setDefaultHostnameVerifier { _, _ -> true }

            val builder = OkHttpClient.Builder()
                .connectTimeout(0, TimeUnit.MILLISECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .writeTimeout(0, TimeUnit.MILLISECONDS)
                .cookieJar(ReactCookieJarContainer())
                .sslSocketFactory(sslSocketFactory, trustAllCerts[0] as X509TrustManager)
                .hostnameVerifier { _, _ -> true }

            builder.build()
        } catch (e: Exception) {
            Log.e(TAG, e.message ?: "Unknown error")
            throw RuntimeException(e)
        }
    }
}
