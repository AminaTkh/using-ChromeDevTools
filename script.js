const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');

function launchChrome(headless=false) {
  return chromeLauncher.launch({
    port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      '--window-size=712,732',
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });
}


const url = "https://www.example.com/"; //website url
const real_url = 'www.example.ru'; //request.host or request.authority  
let isNeed = false;
flag_req = 0
old = ''
frame_current = ''
async function test() {

        const chrome = await launchChrome();
        const protocol = await CDP({port: chrome.port});
        const {Page, Runtime, DOMDebugger, Debugger, Network} = protocol;
        await Promise.all([Debugger.enable(), Network.enable(), Page.enable(), Runtime.enable()]);
        const req_ids = new Set();      
        await Page.navigate({url: url});
 		await Page.loadEventFired();		
		await new Promise(resolve => setTimeout(resolve, 3000));
		
		await DOMDebugger.setXHRBreakpoint({'url' : real_url});

        let parames  =
        await Debugger.paused((params) => {
	        
	        old = frame_current
       		frame_current = JSON.stringify(params.callFrames); 
			Network.requestWillBeSentExtraInfo(({headers, requestId}) => {
				isNeed = false;
				host = headers['Host'];
				auth = headers[':authority'];
				isNeed = (host == real_url) || (auth == real_url);
	
				if ((isNeed) && (flag_req == 0)){  
					flag_req = 1
					req_ids.add(requestId);
				}
			  
			});
	  	
			Network.requestWillBeSent(({requestId, request}) => {
				 if ((req_ids.has(requestId)) && (flag_req == 1)){ 
						 console.log(frame_current) 
						 flag_req += 1;
						 console.log('!#!') //separator 
						 console.log(JSON.stringify(request));
						 console.log('!#!')
				 }
	
			});
			
			Network.responseReceived( ({requestId, response}) => {
			   if ((req_ids.has(requestId)) && (flag_req == 2)) {
				flag_req += 1;
				console.log(JSON.stringify(response));
			   }
			});
	
	
		  	Debugger.resume()
		  
	        
		})
}
test();

