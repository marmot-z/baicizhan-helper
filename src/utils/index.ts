import { MeanInfo } from "@/api/types";

/**
 * 聚合展示单词的中文信息
 * @param chnMeans 中文释义数组
 * @returns 按词性分组的中文释义对象
 */
function groupChineseMeanings(chnMeans: MeanInfo[]): Map<string, string[]> {
    const meansByType = new Map<string, string[]>();
    chnMeans.forEach(meanInfo => {
        const type = meanInfo.mean_type || '其他';
        if (!meansByType.has(type)) {
            meansByType.set(type, []);
        }
        meansByType.get(type)!.push(meanInfo.mean);
    });

    return meansByType;
}

function isEnglishWord(text: string): boolean {
    const trimmedText = text.trim()
    return /^[a-zA-Z]+$/.test(trimmedText) && trimmedText.length > 0
}

export { isEnglishWord, groupChineseMeanings }