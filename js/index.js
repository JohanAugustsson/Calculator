window.addEventListener('load',function(){


  loadObjects();

  if(screen.width<900){
    document.getElementById("inputNumber").readOnly = true;
  }else {
    document.getElementById("inputNumber").readOnly = false;
  };

}) // windows load end

window.onresize = function(){

  if(screen.width<900){
    document.getElementById("inputNumber").readOnly = true;
  }else {
    document.getElementById("inputNumber").readOnly = false;
  };
}



let loadObjects=()=>{

  let settings={
    el: "#container-Calculate",
    data: {
      result: 0,
      currentValue: "",
      currentCalc: "",
      history: [],
      polishArray: [],
      msgToUsr : ""
    },
    methods: {
      digit: function(event,str){
        let b = String(str).charCodeAt(0)
        this.checkKey(event,b,str)

      },
      add: function(event,key){
        this.currentValue += key;
      },
      reset: function(event){
        this.currentCalc= "";
        this.currentValue="";
      },
      resetHistory: function(event){
        this.currentCalc= "";
        this.currentValue="";
        this.polishArray = [];
        this.result=0;
        this.history= [];
      },
      calculate: function(event){  // summera ihop listan
        this.currentCalc = String(this.currentCalc)+String(this.currentValue);
        this.currentValue="";
        this.polishArray = convertToPolishArray(this.currentCalc,this.history); // gör om sträng till polishArray
        if(this.result!==0){
          this.polishArray.unshift(this.result)
        }
        this.result = calcPolishArray(this.polishArray);           // räknar ut allt

        let historyObj= {
          calc : this.currentCalc,
          result : this.result
        }
        this.history.push(historyObj)
        this.currentCalc ="";
      },
      removeValue: function(event){
        let current = this.currentValue
        let length  = current.length;
        this.currentValue = current.substring(0,length - 1)
      },
      checkKey: function(event,strCode,str){
        //console.log(event.keyCode);
        //console.log(strCode);
        let codeOfkey ="";
        let key = "";
        if(str===undefined){
          codeOfkey = event.keyCode;
          key = event.key;
        }else{
          codeOfkey = strCode;
          key = str
        }
        let testIsOk = true;
        if(this.history.length==0 && this.currentValue.length==0){ // om det inte finns någon history så måste man börja med siffror eller ( eller - eller root

          if(codeOfkey>= 48 && codeOfkey <= 57 || codeOfkey==40  || codeOfkey==45 || codeOfkey==8730){
          }else {
            this.showMsgToUser('INFO: Please enter numbers or - ( √ to start your calculation.');
            testIsOk = false;
          }

        }else if(this.history.length>0 && this.currentValue.length==0){ // om det finns history så måste man börja med operator + - / *
          if( codeOfkey==42 ||  codeOfkey==43 ||  codeOfkey==45 ||  codeOfkey==47){
          }else{
            this.showMsgToUser('INFO: Please enter + - * / to add to current result or C to restart.');
            testIsOk = false;

          }
        }

        if(testIsOk){
          if(codeOfkey>= 45 && codeOfkey <= 57 ||  codeOfkey>=40 && codeOfkey <= 43 || codeOfkey==178 || codeOfkey==8730){  // keypress endast siffror och punkt
            this.currentValue= this.currentValue + key;
          }else if(codeOfkey===13){     // keypress enter
            this.calculate();

          }else {                       // keypress övriga
            this.showMsgToUser('INFO: Please only numbers and operators.');
            event.preventDefault();
          }

        }else{ // test fail
          event.preventDefault();
        }


      },
      showMsgToUser : function(str){
        this.msgToUsr = str;
        let timer = setInterval(()=> {
          this.msgToUsr="";
          clearInterval(timer);
        }, 5000);
      }
    }
  }

  let vm = new Vue(settings);


} // end of loadObjects ---------------------------------------------------------------//



// ---------------------  Räknar ut Polish Array ----------------------------->>
let calcPolishArray=(list)=>{
  let stack = []
  list.forEach(item=>{
    if(!isNaN(item)){  // om det är ett nummer
      stack.push(item);
    }else{
      let lastNumber = "";
      let nextNumber = "";
      if(item=="√" || item==="²"){  // endast ett nummer skall popas från stacken
        lastNumber = stack.pop();
      }else {
        lastNumber = stack.pop();
        nextNumber = stack.pop();
      }

      let sum = count(lastNumber,nextNumber,item);
      stack.push(sum);
    }
  })

  return stack[0];
}
//-------------------------- END --------------------------------------------->>


//----------------------  Räknar ut nuvarande tal ---------------------------->>
let count = (lastNumber,nextNumber,todo)=>{
  let sum = 0;
  (todo=="+") ? sum = Number(nextNumber) + Number(lastNumber):"";    // räknar ut summa av 2 sista talen
  (todo=="-") ? sum = Number(nextNumber) - Number(lastNumber):"";    // räknar ut summa av 2 sista talen
  (todo=="/") ? sum = Number(nextNumber) / Number(lastNumber):"";    // räknar ut summa av 2 sista talen
  (todo=="*") ? sum = Number(nextNumber) * Number(lastNumber):"";    // räknar ut summa av 2 sista talen
  (todo=="√") ? sum = Math.sqrt(Number(lastNumber)):"";              // räknar ut summa av 2 sista talen
  (todo=="²") ? sum = Number(lastNumber) * Number(lastNumber):"";    // räknar ut summa av 2 sista talen
  return sum;                                                                       // lägger in ny summa
}
//---------------------- END ------------------------------------------------->>



//------------------------ Convert String to an Array ----------------------->>

let convertToPolishArray=(str,history)=>{

  let stackQueue = [];
  let stackOp = [];
  let newOpArray = convertStringToArray(str,history); // konverterar string till lista med operator objekt och siffror

  newOpArray.forEach(item=>{
    if(!isNaN(item)){
      stackQueue.push(item)
    }else{
      // 1 -  om stack är tom skicka
      // 2 - så långe stack top har högre prec popa stackop top till stackque
      // 3 - om ( lägg på stackop
      // 4 - om ) popa stackTop till stackQue till vi kommer till (.. om den inte finns skicak felmeddelande
      let top  = stackOp.length-1



      if(stackOp.length==0){   //  Hanterar nr 1 ----------------------
        stackOp.push(item);
      }else{


        if(item.operator =="("){           // hanterar nr 3
         stackOp.push(item);
       }else if(item.operator ==")"){     // Hanterar nr 4
         let continueNow = true;
         while(continueNow){

           if(stackOp.length-1<0){  // kontroll så att inte stackOp är tom
             continueNow = false;
           }else if(stackOp[stackOp.length-1].operator !=="("){ // om inte ( pusha till stackQueue
              stackQueue.push(stackOp.pop());
            }else {
              stackOp.pop() // tar bort (
              continueNow = false;
            }

         }

       }else{

         let topPrec = stackOp[top].opPrec; // Hanterar nr 2 --------------
         while(item.opPrec <= topPrec){   // om precedence är lägre än stackOp top så skall stack op top skickas till queue
           stackQueue.push(stackOp.pop());

           if(stackOp.length-1 < 1){    // kontroll så att inte stackOp är tom
             topPrec = 0;
           }else {
             topPrec = stackOp[stackOp.length-1].opPrec;
           }
         }
         stackOp.push(item);          // skickar in nuvarande operator
       }
      }
    }
  })


  while(stackOp.length>0){    // skickar över stackOp till stackQueue.. tar bort eventuell "("
    let op = stackOp.pop();
    if(op.operator!=="("){
      stackQueue.push(op);
    }
  }

  let previousIsNumber = false;

  stackQueue = stackQueue.map(item=>{   // tar bort operator objekt och lägger in endast operator
    if(isNaN(item)){
      // om operatorn är ( så skall ett * läggas till om föregående tecken är ett tal
      // om operatorn är ) så skall ett * läggas till om nästa tecken är ett tal
      if(item.operator=="("){
        if(previousIsNumber){

        }
      }
      return item.operator;
    }else{
      return item;
    }
  })
  return stackQueue;
}

//-----------------------------  END ----------------------------------------->>



//---------------- Konverterar en sträng till en lång array ------------------>>
let convertStringToArray=(str,history)=>{
  let currentValue="";
  let newList = [];
  for(let i =0; i< str.length;i++){
    if(!isNaN(str[i]) || str[i]==="."){
      currentValue+=String(str[i]);
      if(i==str.length-1){
        newList.push(currentValue);
      }
    }else{
      if(currentValue){
        newList.push(currentValue);
        currentValue = "";
      }

      let operator = str[i]; 
      let opPrec = 13;          // precedence av operatorn (prioritet * går före +)
      let calcNb = 2;           // antal nummer som skall beräknas
      let leftToRight = true;   // läsa vänter till höger
      switch(operator){          // här kan vi lägga på fler beräkningar
        case "+":
          //oprator = "+";
          break;
        case "-" :
          //oprator = "-";
          break;
        case "/" :
          opPrec = 15;
          break;
        case "*" :
          opPrec = 15;
          break;
        case "(" :
          opPrec = 0;
          break;
        case ")" :
          opPrec = 0;
          break;
        case "√" :
          opPrec = 100;
          break;
        case "²" :
          opPrec = 100;
          break;
        default :
          console.log("not a operator that works");
      }

      let opObj = {
        operator,
        opPrec,
        calcNb,
        leftToRight,
      }
      newList.push(opObj);

    }
  }

  newList = findParantes(newList); // Om vi har en parantes direkt följt av ett tal skall * läggas till
  newList = findNegativNumber(newList,history); // Behanldar negativa nummer
  return newList;
}
//----------------------------- END ------------------------------------------//




//------------------- Find negativ number ----------------------------------->>
let findNegativNumber=(newList,history)=>{

  newList.forEach((item,index)=>{
    if(item.operator =="-"){    // kontrollerar om vi har ett eventuelt negativt nummer att behandla
      let pos = index
      let found = false;
      while(newList[pos-1] && pos>0){  //Går till föregående position tills ett nummer alternativt en operator hittas.

        if(isNaN(newList[pos-1])){  //kontrollerar om föregående position är ett nummer

          //if( newList[pos-1].operator === "(" || newList[pos-1].operator === ")" ){ // om föregående position är "(" eller ")" skall vi gå till föregående position
          if(newList[pos-1].operator === ")" ){ // om föregående position är "(" eller ")" skall vi gå till föregående position
            } else { // innebär att vi har en operator +-/* root mm och minus tecknet står för ett negativt tal
               newList[pos+1] = "-" + String(newList[pos+1])
               newList.splice(pos,1)
               found= true;
               break;
           }
        } else { // föregående pos är ett tal

          found = true
          break;
        }

        pos-=1  // så länge vi inte hittar ett tal eller operator så ska vi fortsätta
      }

      if(!found){ // om vi inte hittar ett nummer framför alternativt en operator så körs denna
          if(history.length==0 ){
              newList[index] = "-" + String(newList[index+1])
              newList.splice(index+1,1)
          }
      }

    }
  });

return newList;
}
//------------------- END --------------------------------------------------//




//------------------- Find Parentes och sätter in *  ----------------------------------->>
let findParantes=(newList)=>{
  let operator = "*";       // sätter upp obejkt för multiplicera operatorn
  let opPrec = 15;          // precedence av operatorn (prioritet * går före +)
  let calcNb = 2;           // antal nummer som skall beräknas
  let leftToRight = true;   // läsa vänter till höger

  let opObj = {
    operator,
    opPrec,
    calcNb,
    leftToRight,
  }

  newList.forEach((item,pos)=>{
    if(item.operator =="("){    // kontrollerar om vi använder parantes

      while(newList[pos-1] && pos>0){  //Går till föregående position tills ett nummer alternativt en operator hittas.

        if(isNaN(newList[pos-1])){  //kontrollerar om föregående position är ett nummer

          if( newList[pos-1].operator === "(" || newList[pos-1].operator === ")" ){ // om föregående position är "(" eller ")" skall vi gå till föregående position

          } else { // innebär att vi har en operator +-/* root mm inget behöver göras
               //newList[pos+1] = "-" + String(newList[pos+1])
               //newList.splice(pos,1)
            break;
          }

        } else { // föregående pos är ett tal
            //lägg till ett * i listan
            newList.splice(pos,0,opObj)
          break;
        }

        pos-=1  // så länge vi inte hittar ett tal eller operator så ska vi fortsätta

      } // while loop end

    } // item ( operator hittades ej


      if(item.operator ==")"){    // kontrollerar om vi använder parantes

        while(newList[pos+1] && pos < newList.length){  //Går till föregående position tills ett nummer alternativt en operator hittas.

          if(isNaN(newList[pos+1])){  //kontrollerar om föregående position är ett nummer

            if( newList[pos+1].operator === "(" || newList[pos+1].operator === ")" ){ // om föregående position är "(" eller ")" skall vi gå till föregående position

            } else { // innebär att vi har en operator +-/* root mm inget behöver göras
                 //newList[pos+1] = "-" + String(newList[pos+1])
                 //newList.splice(pos,1)
              break;
            }

          } else { // föregående pos är ett tal
              //lägg till ett * i listan
              newList.splice(pos+1,0,opObj)
            break;
          }

          pos+=1  // så länge vi inte hittar ett tal eller operator så ska vi fortsätta

        } // while loop end

      } // item ) operator hittades ej

  }); // map end



return newList;
}
//------------------- END --------------------------------------------------//
