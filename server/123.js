const fs = require('fs');
const readline = require('readline');

async function checkLine1451() {
    const filePath = 'D:/Aartalex/price/Price_YAZDA/yazda.csv';
    
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath, { encoding: 'latin1' }),
        crlfDelay: Infinity
    });
    
    let lineNumber = 0;
    
    for await (const line of rl) {
        lineNumber++;
        if (lineNumber === 1451) {
            console.log('📝 Строка 1451:');
            console.log('─────────────────');
            console.log(line);
            console.log('─────────────────');
            
            // Покажем hex каждого символа
            console.log('\n🔍 Hex-коды символов:');
            const hex = [];
            for (let i = 0; i < line.length; i++) {
                const code = line.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
                hex.push(code);
                if (code === '98') {
                    console.log(`👉 Символ ${i+1}: '${line[i]}' = 0x${code} ⚠️ ПРОБЛЕМНЫЙ!`);
                }
            }
            console.log('Полная строка в hex:', hex.join(' '));
            break;
        }
    }
    
    if (lineNumber < 1451) {
        console.log(`❌ В файле только ${lineNumber} строк`);
    }
    
    rl.close();
}

checkLine1451();