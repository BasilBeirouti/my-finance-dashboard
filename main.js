document.addEventListener('DOMContentLoaded', function () {
    let inScopeTransactions = [];

    // Function to fetch and render the chart
    function fetchAndRenderChart(merchantFilterValue = "", startDate = null) {
        fetch("transactions.json")
            .then(response => response.json())
            .then(data => {
                if (startDate) {
                    data = data.filter(transaction => new Date(transaction.date) >= startDate);
                }

                if (merchantFilterValue) {
                    data = data.filter(transaction => transaction.merchant.toLowerCase().includes(merchantFilterValue));
                }

                inScopeTransactions = data;

                let categoryData = {};
                let drilldownData = {};

                data.forEach(transaction => {
                    const category1 = transaction["category-level1"];
                    const category2 = transaction["category-level2"];

                    if (!categoryData[category1]) {
                        categoryData[category1] = 0;
                        drilldownData[category1] = [];
                    }

                    categoryData[category1] += parseFloat(transaction.amount);

                    let subCategoryFound = drilldownData[category1].find(sub => sub.name === category2);
                    if (!subCategoryFound) {
                        drilldownData[category1].push({ name: category2, y: parseFloat(transaction.amount) });
                    } else {
                        subCategoryFound.y += parseFloat(transaction.amount);
                    }
                });

                let highchartsData = [];
                for (let [category, amount] of Object.entries(categoryData)) {
                    highchartsData.push({
                        name: category,
                        y: Math.abs(amount),
                        drilldown: category
                    });
                }

                let highchartsDrilldown = [];
                for (let [category, subcategories] of Object.entries(drilldownData)) {
                    highchartsDrilldown.push({
                        name: category,
                        id: category,
                        data: subcategories
                    });
                }

                renderChart(highchartsData, highchartsDrilldown);
                updateTable(inScopeTransactions);
            });
    }

    // Function to render the chart
    function renderChart(data, drilldownData) {
        Highcharts.chart('container', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Expenses by Category'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    },
                    point: {
                        events: {
                            click: function() {
                                const clickedCategory = this.name;
                                const filteredTransactions = inScopeTransactions.filter(trx => trx["category-level1"] === clickedCategory);
                                updateTable(filteredTransactions);
                            }
                        }
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>${point.y:.2f}</b><br/>' // Added dollar sign for tooltip formatting
            },
            series: [{
                name: 'Categories',
                colorByPoint: true,
                data: data
            }],
            drilldown: {
                series: drilldownData
            }
        });
    }

    // Function to update the transactions table based on the selected category
    function updateTable(transactions) {
        const tableBody = document.getElementById('transactions-table').querySelector('tbody');
        tableBody.innerHTML = "";

        transactions.forEach(trx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${trx.date}</td>
                <td>${trx.merchant}</td>
                <td>${trx["category-level1"]}</td>
                <td>${trx.amount}</td>
            `;
            tableBody.appendChild(row);
        });
        $('#transactions-table').DataTable();
    }

    document.getElementById('merchant-filter').addEventListener('input', function () {
        const merchantFilterValue = this.value.toLowerCase();
        fetchAndRenderChart(merchantFilterValue);
    });

    document.getElementById('last-3-months').addEventListener('click', function () {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        fetchAndRenderChart(document.getElementById('merchant-filter').value, threeMonthsAgo);
    });

    document.getElementById('year-to-date').addEventListener('click', function () {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        fetchAndRenderChart(document.getElementById('merchant-filter').value, startOfYear);
    });

    document.getElementById('this-month').addEventListener('click', function () {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        fetchAndRenderChart(document.getElementById('merchant-filter').value, startOfMonth);
    });

    // Initial fetch
    fetchAndRenderChart();
});
