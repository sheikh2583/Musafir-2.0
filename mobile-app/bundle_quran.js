const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'd:/Musafir/quran/surah';
const OUTPUT_FILE = 'src/data/quran_data.json';

const main = () => {
    try {
        const files = fs.readdirSync(SOURCE_DIR)
            .filter(f => f.endsWith('.json'))
            .sort((a, b) => {
                // Sort by surah number
                const numA = parseInt(a.replace('surah_', '').replace('.json', ''));
                const numB = parseInt(b.replace('surah_', '').replace('.json', ''));
                return numA - numB;
            });

        const allSurahs = files.map(file => {
            const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');
            // Remove BOM if present
            const cleanContent = content.replace(/^\uFEFF/, '');
            const json = JSON.parse(cleanContent);

            return {
                index: json.index,
                name: json.name,
                juz: json.juz,
                count: json.count,
                verse: json.verse
            };
        });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSurahs, null, 2), { encoding: 'utf8' });
        console.log(`Successfully wrote ${allSurahs.length} surahs to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error('Error bundling quran data:', err);
    }
};

main();
