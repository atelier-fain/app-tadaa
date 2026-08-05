const config = {
  appId: 'org.chromium.webpack.abe660f465bd92ffd_v2',
  sourceCode: '5428',
  callback: 'https://atelier-fain.github.io/app-tadaa/',
  ISV_amount: 0,
  ISV_clientId: '36d0ak0fs34pp7ptont4wso291bmzydpuc8mqsd7ydf76.apps.vivapayments.com',
  ISV_clientSecret: 'ZdJTeAoE25V7Y8F5P6T5n67Cef8yHH',
  ISV_sourceCode: '3654',
  ISV_currencyCode: '946',
  ISV_customerTrns: 'BigLittleFestival',
  paymentMethod: 'CardPresent'
}

export function buildVivaPayUrl (payload = {}) {
  const params = {
    appId: config.appId,
    action: 'sale',
    amount: payload.amount,
    sourceCode: config.sourceCode,
    callback: config.callback,
    ISV_amount: config.ISV_amount,
    ISV_clientId: config.ISV_clientId,
    ISV_clientSecret: config.ISV_clientSecret,
    ISV_sourceCode: config.ISV_sourceCode,
    ISV_currencyCode: config.ISV_currencyCode,
    ISV_customerTrns: config.ISV_customerTrns,
    clientTransactionId: payload.user,
    paymentMethod: config.paymentMethod
  }

  return 'vivapayclient://pay/v1?' + Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}
