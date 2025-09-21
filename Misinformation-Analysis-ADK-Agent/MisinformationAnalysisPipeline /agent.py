# NEW -- Import FastAPI to create the web server
from fastapi import FastAPI
from google.adk.agents import SequentialAgent, ParallelAgent
from google.adk.tools.agent_tool import AgentTool

# Your existing agents
from .sub_agents.claims_extractor_agent.agent import claims_extractor
from .sub_agents.web_scraper_agent.agent import web_scraper
from .sub_agents.report_generator_agent.agent import report_generator
from .sub_agents.fact_checking_agent.agent import fact_checker  
from dotenv import load_dotenv

load_dotenv()

# --- YOUR EXISTING AGENT DEFINITION (NO CHANGES HERE) ---

# Define a parallel agent to run tasks simultaneously
parallel_research_agent = ParallelAgent(
    name="ParallelResearchAgent",
    sub_agents=[web_scraper, fact_checker],
    description="Runs web scraping and fact checking tasks in parallel to speed up evidence gathering."
)

# Define the sequential pipeline
root_agent = SequentialAgent(
    name="MisinformationAnalysisPipeline",
    sub_agents=[claims_extractor, parallel_research_agent, report_generator],
    description="A multi-agent pipeline that extracts claims, performs parallel research, and generates a report."
)


# --- NEW -- WEB SERVER AND ENDPOINT CODE ---

# 1. Create a FastAPI application instance
app = FastAPI(
    title="Misinformation Analysis Agent",
    description="API endpoint for the multi-agent misinformation pipeline.",
    version="1.0.0"
)

# 2. Define the web endpoint
# This tells FastAPI to listen for GET requests at the root URL ("/")
@app.get("/")
def run_agent(text: str):
    """
    Accepts a text claim, runs it through the agent pipeline, and returns the result.
    """
    # 3. Invoke your agent with the input text
    # The agent's result is naturally a dictionary, which FastAPI turns into JSON
    result = root_agent.invoke({"text": text})
    
    # 4. Return the agent's output
    # This is the crucial step that sends the JSON response back
    return result