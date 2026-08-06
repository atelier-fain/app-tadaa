const dev = process.env.DEV === 'true'

const config = {
  appId: 'org.chromium.webpack.abe660f465bd92ffd_v2',
  sourceCode: dev ? process.env.DEV__sourceCode : process.env.sourceCode,
  callback: 'https://dev.tadaa.ro/callback',
  ISV_amount: 4,
  ISV_clientId: dev ? process.env.DEV__ISVClientID : process.env.ISVClientID,
  ISV_clientSecret: dev ? process.env.DEV__ISVClientSecret : process.env.ISVClientSecret,
  ISV_sourceCode: dev ? process.env.DEV__ISCSourceCode : process.env.ISCSourceCode,
  ISV_currencyCode: '946',
  ISV_customerTrns: 'BigLittleFestival',
  paymentMethod: 'CardPresent'
}

export function buildVivaPayUrl (payload = {}) {
  const params = {
    appId: config.appId,
    action: 'sale',
    amount: payload?.totalPrice,
    sourceCode: config.sourceCode,
    callback: config.callback,
    ISV_amount: payload?.totalPrice * config.ISV_amount/100 ,
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
