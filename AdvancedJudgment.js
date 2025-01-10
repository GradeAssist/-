document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('courseForm');
    restoreYearSelection();
    restoreFieldSelection();
    restoreSelections();

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            saveYearSelection();
            saveFieldSelection();
            saveSelections();
            checkEligibility();
        });
    } else {
        console.error('フォーム要素が見つかりません。');
    }
});

// 年度別の進級・卒業条件
const criteria = {
    1: {
        requiredCredits: 24,
        requiredCourses: [],
        message: '2年生に進級可能です!'
    },
    2: {
        requiredCredits: 48,
        requiredCourses: ['キャリアデザイン学入門［2単位］', 'キャリア研究調査法入門［2単位］'],
        message: '3年生に進級可能です!'
    },
    3: {
        requiredCredits: 88,
        requiredCourses: ['キャリアデザイン学入門［2単位］', 'キャリア研究調査法入門［2単位］',
                          'スポーツ総合演習［2単位］', '英語１－Ⅰ［1単位］', '英語１－Ⅱ［1単位］', 
                          '英語２－Ⅰ［1単位］', '英語２－Ⅱ［1単位］'],
        message: '4年生に進級可能です!'
    },
    4: {
        requiredCredits: 132,
        requiredCourses: ['キャリアデザイン学入門［2単位］', 'キャリア研究調査法入門［2単位］',
                          'スポーツ総合演習［2単位］', '英語１－Ⅰ［1単位］', '英語１－Ⅱ［1単位］', 
                          '英語２－Ⅰ［1単位］', '英語２－Ⅱ［1単位］'],
        message: '卒業見込みです!'
    }
};

// 領域別条件設定
const fieldCriteria = {
    'ビジネス領域': {
        groupName: 'ビジネス',
        totalCredits: 36,
        combinedCredits: 52,
        experientialCredits: 4,
        experientialGroup: '選択必修(体験型)',
        electiveGroup: '選択必修（ビジネス）',
        electiveCredits: 6,
        otherGroups: ['発達・教育', 'ライフ']
    },
    '発達・教育領域': {
        groupName: '発達・教育',
        totalCredits: 36,
        combinedCredits: 52,
        experientialCredits: 4,
        experientialGroup: '選択必修(体験型)',
        electiveGroup: '選択必修（発達・教育）',
        electiveCredits: 6,
        otherGroups: ['ビジネス', 'ライフ']
    },
    'ライフ領域': {
        groupName: 'ライフ',
        totalCredits: 36,
        combinedCredits: 52,
        experientialCredits: 4,
        experientialGroup: '選択必修(体験型)',
        electiveGroup: '選択必修（ライフ）',
        electiveCredits: 6,
        otherGroups: ['ビジネス', '発達・教育']
    }
};

const groupCriteria = [
    { groupName: '１００番台１群（人文分野）', requiredCredits: 4 },
    { groupName: '１００番台２群（社会分野）', requiredCredits: 4 },
    { groupName: '１００番台３群（自然分野）', requiredCredits: 4 },
    { groupName: '２００番台１群（人文分野）', requiredCredits: 2 },
    { groupName: '２００番台２群（社会分野）', requiredCredits: 2 },
    { groupName: '２００番台番台３群（自然分野）', requiredCredits: 2 }

];

// 必修諸外国語の条件
const foreignLanguageCriteria = {
    requiredCredits: 4,
    groupName: '１００番台４群（［必修］諸外国語）'
};

// キャリア研究調査法の必修条件
const requiredElectiveForGraduation = {
    requiredCredits: 2,
    groupName: '選択必修(キャリア研究調査法)'
};

// データ保存・復元機能
function saveYearSelection() {
    const year = document.getElementById('year').value;
    localStorage.setItem('selectedYear', year);
}

function restoreYearSelection() {
    const savedYear = localStorage.getItem('selectedYear');
    if (savedYear) {
        document.getElementById('year').value = savedYear;
    }
}

function saveFieldSelection() {
    const field = document.getElementById('field').value;
    localStorage.setItem('selectedField', field);
}

function restoreFieldSelection() {
    const savedField = localStorage.getItem('selectedField');
    if (savedField) {
        document.getElementById('field').value = savedField;
    }
}

function saveSelections() {
    const selectedCourses = Array.from(document.querySelectorAll('input[name="requiredCourse"]:checked'))
        .map(option => option.value);
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses));
}

function restoreSelections() {
    const selectedCourses = JSON.parse(localStorage.getItem('selectedCourses') || '[]');
    selectedCourses.forEach(courseValue => {
        const checkbox = Array.from(document.querySelectorAll('input[name="requiredCourse"]'))
            .find(option => option.value === courseValue);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

// 領域条件チェック
function checkFieldCriteria(selectedCourses, selectedField) {
    const fieldConfig = fieldCriteria[selectedField];
    let totalCredits = 0;
    let combinedCredits = 0;
    let experientialCredits = 0;
    let electiveCredits = 0;
    let errors = [];

    selectedCourses.forEach(course => {
        const courseName = course.value;
        const match = courseName.match(/［(\d+)単位］/);
        const credits = match ? parseInt(match[1]) : 0;
        const group = course.getAttribute('data-group');

        if (group === fieldConfig.groupName) {
            totalCredits += credits;
            combinedCredits += credits;
        }

        if (fieldConfig.otherGroups.includes(group)) {
            combinedCredits += credits;
        }

        if (group === fieldConfig.experientialGroup) {
            experientialCredits += credits;
        }

        if (group === fieldConfig.electiveGroup) {
            electiveCredits += credits;
        }
    });

    if (totalCredits < fieldConfig.totalCredits) {
        errors.push(`${selectedField}の科目群から${fieldConfig.totalCredits}単位以上必要です。現在は${totalCredits}単位です。`);
    }
    if (combinedCredits < fieldConfig.combinedCredits) {
        errors.push(`他の領域を含めて${fieldConfig.combinedCredits}単位以上必要です。現在は${combinedCredits}単位です。`);
    }
    if (experientialCredits < fieldConfig.experientialCredits) {
        errors.push(`体験型から${fieldConfig.experientialCredits}単位以上必要です。現在は${experientialCredits}単位です。`);
    }
    if (electiveCredits < fieldConfig.electiveCredits) {
        errors.push(`${fieldConfig.electiveGroup}から${fieldConfig.electiveCredits}単位以上必要です。現在は${electiveCredits}単位です。`);
    }

    return errors.join('<br>');
}

// 年度別条件チェック
function checkYearCriteria(selectedCourses, year) {
    const yearConfig = criteria[year];
    let totalCredits = 0;
    let missingCourses = [];

    selectedCourses.forEach(course => {
        const match = course.value.match(/［(\d+)単位］/);
        const credits = match ? parseInt(match[1]) : 0;
        totalCredits += credits;

        if (yearConfig.requiredCourses.includes(course.value)) {
            yearConfig.requiredCourses = yearConfig.requiredCourses.filter(req => req !== course.value);
        }
    });

    if (totalCredits < yearConfig.requiredCredits) {
        missingCourses.push(`必要単位: ${yearConfig.requiredCredits}単位, 現在: ${totalCredits}単位`);
    }
    if (yearConfig.requiredCourses.length > 0) {
        missingCourses.push(`不足科目: ${yearConfig.requiredCourses.join(', ')}`);
    }

    return missingCourses.length > 0 ? missingCourses.join('<br>') : yearConfig.message;
}

// キャリア研究調査法の必修条件チェック
function checkElectiveForGraduation(selectedCourses) {
    const requiredGroup = requiredElectiveForGraduation.groupName; // 必須グループ名
    const requiredCredits = requiredElectiveForGraduation.requiredCredits; // 必要単位数

    let earnedCredits = 0;

    selectedCourses.forEach(course => {
        const group = course.getAttribute('data-group'); // data-group属性をチェック
        const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
        const credits = match ? parseInt(match[1]) : 0;

        if (group === requiredGroup) {
            earnedCredits += credits; // 該当するグループの単位を加算
        }
    });

    // 必要単位数未満の場合はエラーメッセージを返す
    if (earnedCredits < requiredCredits) {
        return `${requiredGroup}から${requiredCredits}単位以上必要です。現在は${earnedCredits}単位です。`;
    }

    return ''; // 条件を満たしている場合はエラーなし
}

// 自由科目の単位を計算（最大16単位まで加算する関数）
function calculateFreeElectiveCredits(selectedCourses) {
    const freeElectiveLimit = 16; // 判定に加算する自由科目の上限
    let totalFreeElectiveCredits = 0;
    let countableCredits = 0;

    selectedCourses.forEach(course => {
        const group = course.getAttribute('data-group'); // data-group属性を取得
        const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
        const credits = match ? parseInt(match[1]) : 0;

        if (group === '自由科目') { // 自由科目グループのみ計算
            totalFreeElectiveCredits += credits;

            // 判定に加算される単位を16単位に制限
            if (countableCredits < freeElectiveLimit) {
                const remaining = freeElectiveLimit - countableCredits;
                countableCredits += Math.min(credits, remaining);
            }
        }
    });

    return { totalFreeElectiveCredits, countableCredits };
}

// 判定処理
function checkEligibility() {
    const year = parseInt(document.getElementById('year').value); // 学年を取得
    const selectedField = document.getElementById('field').value; // 領域を取得
    const selectedCourses = Array.from(document.querySelectorAll('input[name="requiredCourse"]:checked')); // 選択された科目を取得

    let errors = [];
    let totalCredits = 0;

    // 自由科目の単位計算
    const { totalFreeElectiveCredits, countableCredits } = calculateFreeElectiveCredits(selectedCourses);

    // 自由科目の加算分を反映
    totalCredits += countableCredits;

    // 年次別条件のチェック
    const yearCriteriaError = checkYearCriteria(selectedCourses, year);
    if (yearCriteriaError) {
        errors.push(yearCriteriaError);
    }

    // 領域条件のチェック
    if (year !== 3) {
        const fieldCriteriaError = checkFieldCriteria(selectedCourses, selectedField);
        if (fieldCriteriaError) {
            errors.push(fieldCriteriaError);
        }
    }

    // 必修諸外国語の条件を3年生進級条件に追加
    if (year === 3) {
        const foreignLanguageCredits = selectedCourses.reduce((total, course) => {
            const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
            const credits = match ? parseInt(match[1]) : 0;
            const group = course.getAttribute('data-group'); // グループ名を取得
            return group === foreignLanguageCriteria.groupName ? total + credits : total; // 必修諸外国語の単位合計
        }, 0);

        if (foreignLanguageCredits < foreignLanguageCriteria.requiredCredits) {
            errors.push(
                `必修諸外国語から${foreignLanguageCriteria.requiredCredits}単位以上必要です。現在は${foreignLanguageCredits}単位です。`
            );
        }
    }

    // キャリア研究調査法の条件を4年生卒業条件に追加
    if (year === 4) {
        const careerResearchCredits = selectedCourses.reduce((total, course) => {
            const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
            const credits = match ? parseInt(match[1]) : 0;
            const group = course.getAttribute('data-group'); // グループ名を取得
            return group === requiredElectiveForGraduation.groupName ? total + credits : total; // キャリア研究調査法の単位合計
        }, 0);

        if (careerResearchCredits < requiredElectiveForGraduation.requiredCredits) {
            errors.push(
                `選択必修(キャリア研究調査法)から${requiredElectiveForGraduation.requiredCredits}単位以上必要です。現在は${careerResearchCredits}単位です。`
            );
        }
    }

    // エラーをフィルタリング（空文字を除去）
    errors = errors.filter(Boolean);

    let result = "";
    if (errors.length > 0) {
        // 条件未達の場合はエラーメッセージのみ設定
        result = errors.join('<br>');
    } else {
        // 条件をすべて満たした場合のみ成功メッセージを設定
        result = "進級または卒業条件を満たしています！";
    }

    // 自由科目の情報を結果に追加
    result += `<br>自由科目: 登録済み ${totalFreeElectiveCredits}単位, 判定に加算 ${countableCredits}単位`;

    console.log('Final Result:', result); // デバッグ用

    // 結果画面にリダイレクト
    window.location.href = `result.html?result=${encodeURIComponent(result)}`;
}

// 判定処理
function checkEligibility() {
    const year = parseInt(document.getElementById('year').value); // 学年を取得
    const selectedField = document.getElementById('field').value; // 領域を取得
    const selectedCourses = Array.from(document.querySelectorAll('input[name="requiredCourse"]:checked')); // 選択された科目を取得

    let errors = [];

    // 年次別条件のチェック
    errors.push(checkYearCriteria(selectedCourses, year));

    // 3年生進級時には領域条件をスキップ
    if (year !== 3) {
        // 領域条件のチェック（3年生以外で実施）
        errors.push(checkFieldCriteria(selectedCourses, selectedField));
    }

    // 必修諸外国語の条件を3年生進級条件に追加
    if (year === 3) {
        const foreignLanguageCredits = selectedCourses.reduce((total, course) => {
            const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
            const credits = match ? parseInt(match[1]) : 0;
            const group = course.getAttribute('data-group'); // グループ名を取得
            return group === foreignLanguageCriteria.groupName ? total + credits : total; // 必修諸外国語の単位合計
        }, 0);

        if (foreignLanguageCredits < foreignLanguageCriteria.requiredCredits) {
            errors.push(
                `必修諸外国語から${foreignLanguageCriteria.requiredCredits}単位以上必要です。現在は${foreignLanguageCredits}単位です。`
            );
        }
    }

    // ４年生の卒業条件を追加
    if (year === 4) {
        // キャリア研究調査法の条件チェック（既存）
        const careerResearchCredits = selectedCourses.reduce((total, course) => {
            const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
            const credits = match ? parseInt(match[1]) : 0;
            const group = course.getAttribute('data-group'); // グループ名を取得
            return group === requiredElectiveForGraduation.groupName ? total + credits : total; // キャリア研究調査法の単位合計
        }, 0);
    
        if (careerResearchCredits < requiredElectiveForGraduation.requiredCredits) {
            errors.push(
                `選択必修(キャリア研究調査法)から${requiredElectiveForGraduation.requiredCredits}単位以上必要です。現在は${careerResearchCredits}単位です。`
            );
        }
    
        // グループ条件のチェック（新規追加）
        groupCriteria.forEach(criteria => {
            const groupCredits = selectedCourses.reduce((total, course) => {
                const match = course.value.match(/［(\d+)単位］/); // 単位数を抽出
                const credits = match ? parseInt(match[1]) : 0;
                const group = course.getAttribute('data-group'); // グループ名を取得
                return group === criteria.groupName ? total + credits : total; // 指定グループの単位合計
            }, 0);
    
            if (groupCredits < criteria.requiredCredits) {
                errors.push(
                    `${criteria.groupName}から${criteria.requiredCredits}単位以上必要です。現在は${groupCredits}単位です。`
                );
            }
        });
    }

    // エラーをフィルタリング（空文字を除去）
    errors = errors.filter(Boolean);

    let result = "";
    if (errors.length > 0) {
        // 条件未達の場合はエラーメッセージのみ設定
        result = errors.join('<br>');
    } else {
        // 条件をすべて満たした場合のみ成功メッセージを設定
        result = "進級または卒業条件を満たしています！";
    }

    console.log('Final Result:', result); // デバッグ用

    // 結果画面にリダイレクト
    window.location.href = `result.html?result=${encodeURIComponent(result)}`;
}