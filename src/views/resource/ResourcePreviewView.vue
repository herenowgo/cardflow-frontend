<template>
  <a-layout class="h-screen">
    <a-layout-sider width="50%" class="bg-white">
      <div class="p-4 h-full">
        <h2 class="text-2xl font-bold mb-4">PDF Viewer</h2>
        <pdf-viewer :source="pdfUrl" />
      </div>
    </a-layout-sider>
    <a-layout-content class="bg-gray-100">
      <div class="p-4">
        <h2 class="text-2xl font-bold mb-4">Flashcard Maker</h2>
        <a-form :model="flashcard" @submit.prevent="createFlashcard">
          <a-form-item field="question" label="Question">
            <a-input
              v-model="flashcard.question"
              placeholder="Enter question"
            />
          </a-form-item>
          <a-form-item field="answer" label="Answer">
            <a-textarea v-model="flashcard.answer" placeholder="Enter answer" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit"
              >Create Flashcard</a-button
            >
          </a-form-item>
        </a-form>

        <a-divider />

        <h3 class="text-xl font-bold mb-2">Flashcards</h3>
        <a-list :data="flashcards" class="mb-4">
          <template #item="{ item }">
            <a-list-item>
              <a-card hoverable>
                <template #title>{{ item.question }}</template>
                <template #extra>
                  <a-button status="danger" @click="deleteFlashcard(item)"
                    >Delete</a-button
                  >
                </template>
                {{ item.answer }}
              </a-card>
            </a-list-item>
          </template>
        </a-list>

        <a-button
          type="primary"
          @click="analyzeFlashcards"
          :loading="analyzing"
        >
          Analyze Flashcards
        </a-button>

        <a-modal
          v-model:visible="showAnalysis"
          title="AI Analysis"
          @ok="showAnalysis = false"
        >
          <p>{{ aiAnalysis }}</p>
        </a-modal>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref, reactive } from "vue";
import { Message } from "@arco-design/web-vue";
import PdfViewer from "./PdfViewer.vue";

const pdfUrl = ref(
  "http://code-flow-q.oss-cn-shanghai.aliyuncs.com/user/1861024855969775618/%E5%9F%BA%E4%BA%8E%E5%BE%AE%E6%9C%8D%E5%8A%A1%E6%9E%B6%E6%9E%84%E7%9A%84%E7%BC%96%E7%A8%8B%E5%AE%9E%E8%B7%B5%E6%95%99%E5%AD%A6%E5%B9%B3%E5%8F%B0%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0_%E5%94%90%E6%99%93.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI5t7xoioU8NcvvG3FQFU8%2F20241226%2Foss-cn-shanghai%2Fs3%2Faws4_request&X-Amz-Date=20241226T125218Z&X-Amz-Expires=1800&X-Amz-SignedHeaders=host&X-Amz-Signature=20fa1cc249e169ce3ccba7cf672958dc0b943007e58cecf91c9aaeb4a35229e2"
); // Replace with your PDF URL

const flashcard = reactive({
  question: "",
  answer: "",
});

const flashcards = ref([]);

const showAnalysis = ref(false);
const aiAnalysis = ref("");
const analyzing = ref(false);

const createFlashcard = () => {
  if (flashcard.question && flashcard.answer) {
    flashcards.value.push({ ...flashcard });
    flashcard.question = "";
    flashcard.answer = "";
    Message.success("Flashcard created successfully");
  } else {
    Message.error("Please fill in both question and answer");
  }
};

const deleteFlashcard = (item) => {
  const index = flashcards.value.indexOf(item);
  if (index > -1) {
    flashcards.value.splice(index, 1);
    Message.success("Flashcard deleted successfully");
  }
};

const analyzeFlashcards = async () => {
  analyzing.value = true;
  try {
    // This is a mock API call. Replace with your actual AI analysis API
    const response = await fetch("https://api.example.com/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flashcards.value),
    });
    const data = await response.json();
    aiAnalysis.value = data.analysis;
    showAnalysis.value = true;
  } catch (error) {
    Message.error("Failed to analyze flashcards");
    console.error("Error:", error);
  } finally {
    analyzing.value = false;
  }
};
</script>
