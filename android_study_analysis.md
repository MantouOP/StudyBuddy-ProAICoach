# Android Study Analysis Dashboard Implementation

Here is the complete implementation for the Study Analysis dashboard using the **MPAndroidChart** library, Firebase Firestore, and Java.

## 1. Prerequisites

First, add the MPAndroidChart dependency to your app-level `build.gradle` file:

```gradle
dependencies {
    // ... other dependencies
    implementation 'com.github.PhilJay:MPAndroidChart:v3.1.0'
}
```

*Note: Make sure you have `maven { url 'https://jitpack.io' }` in your `settings.gradle` or project-level `build.gradle` file under `repositories`.*

---

## 2. Firestore Schema

Collection: `study_sessions`
- Document ID: (Auto-generated)
  - `userId`: String (e.g., "user123")
  - `subject`: String (e.g., "Computer Systems Organization")
  - `durationMinutes`: Number (e.g., 120)
  - `timestamp`: Timestamp (Firebase server timestamp)

---

## 3. UI Layout (XML)

Create a layout file named `activity_study_analysis.xml`. This uses a `ScrollView` containing a summary card, a `BarChart` for daily hours, and a `PieChart` for the subject breakdown.

```xml
<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#F8FAFC">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <!-- Summary Card -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="16dp"
            app:cardCornerRadius="12dp"
            app:cardElevation="4dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Weekly Summary"
                    android:textColor="#0F172A"
                    android:textSize="18sp"
                    android:textStyle="bold" />

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="12dp"
                    android:orientation="horizontal">

                    <LinearLayout
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:orientation="vertical">

                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="Total Hours"
                            android:textColor="#64748B"
                            android:textSize="14sp" />

                        <TextView
                            android:id="@+id/tvTotalHours"
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="0.0h"
                            android:textColor="#4F46E5"
                            android:textSize="24sp"
                            android:textStyle="bold" />
                    </LinearLayout>

                    <LinearLayout
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:orientation="vertical"
                        android:gravity="end">

                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="Avg Daily"
                            android:textColor="#64748B"
                            android:textSize="14sp" />

                        <TextView
                            android:id="@+id/tvAvgDailyHours"
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="0.0h"
                            android:textColor="#4F46E5"
                            android:textSize="24sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                </LinearLayout>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Bar Chart Card -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="16dp"
            app:cardCornerRadius="12dp"
            app:cardElevation="4dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginBottom="12dp"
                    android:text="Daily Study Time (Last 7 Days)"
                    android:textColor="#0F172A"
                    android:textSize="16sp"
                    android:textStyle="bold" />

                <com.github.mikephil.charting.charts.BarChart
                    android:id="@+id/barChart"
                    android:layout_width="match_parent"
                    android:layout_height="250dp" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Pie Chart Card -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="16dp"
            app:cardCornerRadius="12dp"
            app:cardElevation="4dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginBottom="12dp"
                    android:text="Subject Breakdown"
                    android:textColor="#0F172A"
                    android:textSize="16sp"
                    android:textStyle="bold" />

                <com.github.mikephil.charting.charts.PieChart
                    android:id="@+id/pieChart"
                    android:layout_width="match_parent"
                    android:layout_height="250dp" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <Button
            android:id="@+id/btnInjectData"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Inject Dummy Data (For Testing)"
            android:backgroundTint="#10B981"/>

    </LinearLayout>
</ScrollView>
```

---

## 4. Backend Logic (Java)

Create `StudyAnalysisActivity.java`. This fetches the data, aggregates it by day and by subject, and configures the `MPAndroidChart` views.

```java
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.google.firebase.Timestamp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class StudyAnalysisActivity extends AppCompatActivity {

    private TextView tvTotalHours, tvAvgDailyHours;
    private BarChart barChart;
    private PieChart pieChart;
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_study_analysis);

        tvTotalHours = findViewById(R.id.tvTotalHours);
        tvAvgDailyHours = findViewById(R.id.tvAvgDailyHours);
        barChart = findViewById(R.id.barChart);
        pieChart = findViewById(R.id.pieChart);
        Button btnInjectData = findViewById(R.id.btnInjectData);

        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();

        btnInjectData.setOnClickListener(v -> injectSampleData());

        fetchStudyData();
    }

    private void fetchStudyData() {
        if (mAuth.getCurrentUser() == null) return;
        String userId = mAuth.getCurrentUser().getUid();

        // Calculate timestamp for 7 days ago
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, -6);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        Date sevenDaysAgo = cal.getTime();

        db.collection("study_sessions")
                .whereEqualTo("userId", userId)
                .whereGreaterThanOrEqualTo("timestamp", new Timestamp(sevenDaysAgo))
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    Map<String, Float> dailyStats = new HashMap<>();
                    Map<String, Float> subjectStats = new HashMap<>();
                    float totalMinutesThisWeek = 0;

                    SimpleDateFormat sdf = new SimpleDateFormat("MMM dd", Locale.getDefault());

                    // Initialize the last 7 days with 0 minutes
                    List<String> last7DaysLabels = new ArrayList<>();
                    for (int i = 6; i >= 0; i--) {
                        Calendar c = Calendar.getInstance();
                        c.add(Calendar.DAY_OF_YEAR, -i);
                        String dayLabel = sdf.format(c.getTime());
                        last7DaysLabels.add(dayLabel);
                        dailyStats.put(dayLabel, 0f);
                    }

                    // Aggregate data
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        Long duration = doc.getLong("durationMinutes");
                        String subject = doc.getString("subject");
                        Timestamp timestamp = doc.getTimestamp("timestamp");

                        if (duration != null && timestamp != null && subject != null) {
                            float hours = duration / 60f;
                            totalMinutesThisWeek += duration;

                            // Subject aggregation
                            subjectStats.put(subject, subjectStats.getOrDefault(subject, 0f) + hours);

                            // Daily aggregation
                            String dayStr = sdf.format(timestamp.toDate());
                            if (dailyStats.containsKey(dayStr)) {
                                dailyStats.put(dayStr, dailyStats.get(dayStr) + hours);
                            }
                        }
                    }

                    updateUI(totalMinutesThisWeek, dailyStats, subjectStats, last7DaysLabels);
                })
                .addOnFailureListener(e -> Log.e("StudyAnalysis", "Error fetching data", e));
    }

    private void updateUI(float totalMinutes, Map<String, Float> dailyStats, Map<String, Float> subjectStats, List<String> dateLabels) {
        float totalHours = totalMinutes / 60f;
        float avgDailyHours = totalHours / 7f;

        tvTotalHours.setText(String.format(Locale.getDefault(), "%.1fh", totalHours));
        tvAvgDailyHours.setText(String.format(Locale.getDefault(), "%.1fh", avgDailyHours));

        setupBarChart(dailyStats, dateLabels);
        setupPieChart(subjectStats);
    }

    private void setupBarChart(Map<String, Float> dailyStats, List<String> dateLabels) {
        List<BarEntry> entries = new ArrayList<>();
        
        for (int i = 0; i < dateLabels.size(); i++) {
            String label = dateLabels.get(i);
            entries.add(new BarEntry(i, dailyStats.get(label)));
        }

        BarDataSet dataSet = new BarDataSet(entries, "Study Hours");
        dataSet.setColor(Color.parseColor("#4F46E5"));
        dataSet.setValueTextSize(10f);

        BarData barData = new BarData(dataSet);
        barData.setBarWidth(0.5f);

        barChart.setData(barData);
        barChart.getDescription().setEnabled(false);
        barChart.setFitBars(true);
        barChart.getLegend().setEnabled(false);

        // X-Axis config
        XAxis xAxis = barChart.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(dateLabels));
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);

        // Y-Axis config
        barChart.getAxisRight().setEnabled(false);
        barChart.getAxisLeft().setAxisMinimum(0f);
        barChart.getAxisLeft().setDrawGridLines(true);

        barChart.invalidate(); // Refresh
    }

    private void setupPieChart(Map<String, Float> subjectStats) {
        List<PieEntry> entries = new ArrayList<>();
        
        for (Map.Entry<String, Float> entry : subjectStats.entrySet()) {
            entries.add(new PieEntry(entry.getValue(), entry.getKey()));
        }

        PieDataSet dataSet = new PieDataSet(entries, "Subjects");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextSize(12f);
        dataSet.setValueTextColor(Color.WHITE);

        PieData pieData = new PieData(dataSet);

        pieChart.setData(pieData);
        pieChart.getDescription().setEnabled(false);
        pieChart.setCenterText("Subjects");
        pieChart.setCenterTextSize(16f);
        pieChart.setDrawEntryLabels(false);
        pieChart.animateY(1000);
        pieChart.invalidate(); // Refresh
    }

    // --- 5. Sample Data Injection ---
    private void injectSampleData() {
        if (mAuth.getCurrentUser() == null) {
            Toast.makeText(this, "Please logic first!", Toast.LENGTH_SHORT).show();
            return;
        }
        
        String userId = mAuth.getCurrentUser().getUid();
        String[] subjects = {"Computer Systems Org", "Discrete Math", "Java"};

        Calendar cal = Calendar.getInstance();

        for (int i = 0; i < 15; i++) {
            // Random day within the last 7 days
            cal.setTime(new Date());
            cal.add(Calendar.DAY_OF_YEAR, -(int)(Math.random() * 7));
            
            Map<String, Object> session = new HashMap<>();
            session.put("userId", userId);
            session.put("subject", subjects[(int) (Math.random() * subjects.length)]);
            session.put("durationMinutes", 30 + (int) (Math.random() * 90)); // 30 to 120 mins
            session.put("timestamp", new Timestamp(cal.getTime()));

            db.collection("study_sessions").add(session);
        }

        Toast.makeText(this, "Sample data injected! Please wait a moment and reload the activity.", Toast.LENGTH_LONG).show();
    }
}
```

## How to Test

1. Launch your `StudyAnalysisActivity`.
2. Click the green **"Inject Dummy Data"** button at the bottom.
3. Wait just a moment for the data to upload to Firestore.
4. Exit and re-enter the activity to trigger `fetchStudyData()` again. You will see your charts populated with gorgeous visual data!
