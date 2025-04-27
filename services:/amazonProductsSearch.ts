import axios from 'axios';
import crypto from 'crypto';

function sign(key: Buffer, message: string) {
  return crypto.createHmac('sha256', key).update(message).digest();
}

function getSignatureKey(secretKey: string, dateStamp: string, regionName: string, serviceName: string) {
  const kDate = sign(Buffer.from("AWS4" + secretKey, 'utf-8'), dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, "aws4_request");
  return kSigning;
}

function getAuthorizationHeader(accessKey: string, secretKey: string, region: string, service: string, amzDate: string, payload: string) {
  const dateStamp = amzDate.substring(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalUri = "/paapi5/searchitems";
  const canonicalQuerystring = "";
  const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=UTF-8\nhost:webservices.amazon.co.jp\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  
  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const algorithm = "AWS4-HMAC-SHA256";
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')}`;
  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return authorizationHeader;
}

export async function searchAmazonProducts(keyword: string) {
  const accessKey = process.env.AMAZON_ACCESS_KEY!;
  const secretKey = process.env.AMAZON_SECRET_KEY!;
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG!;

  const host = 'webservices.amazon.co.jp';
  const region = 'us-west-2';
  const service = 'ProductAdvertisingAPI';
  const endpoint = `https://${host}/paapi5/searchitems`;

  const payload = {
    Keywords: keyword,
    Resources: [
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "ItemInfo.ProductInfo",
    ],
    SearchIndex: "All",
    ItemCount: 3,
    PartnerTag: associateTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.co.jp",
  };

  const headers: { [key: string]: string } = {
    "Content-Encoding": "amz-1.0",
    "Content-Type": "application/json; charset=UTF-8",
    "Host": host,
    "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    "X-Amz-Date": getAmzDate(),
    "Authorization": "", // ここに署名をあとで入れる
  };

  //payloadをJSON文字列に変換
  const payloadString = JSON.stringify(payload);

  //Authorizationヘッダーの生成
  headers['Authorization'] = getAuthorizationHeader(
    accessKey,
    secretKey,
    region,
    service,
    headers['X-Amz-Date'],
    payloadString
  );


  try {
    const response = await axios.post(endpoint, payloadString, { headers });
    const items = response.data.SearchResult?.Items || [];
    return items.map((item: any) => ({
      title: item.ItemInfo?.Title?.DisplayValue?.replace(/<.*?>/g, ''),
      url: item.DetailPageURL,
      image: item.Images?.Primary?.Medium?.URL,
    }));
    
  } catch (error: any) {
    console.error('Amazon API error:', error.response ? error.response.data : error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

// 日付ヘッダー用の関数
function getAmzDate() {
  const date = new Date();
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}
