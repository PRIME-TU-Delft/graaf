
import { Course, Graph } from '../../routes/course/[course]/classes'

export let courses = [
    new Course("AESB1311", "Linear Algebra"),
    new Course("CSE1200",  "Calculus"),
    new Course("CSE1205",  "Linear Algebra"),
    new Course("CSE1210",  "Cluster Probability & Statistics"),
    new Course("CTB2105",  "Differentiaalvergelijkingen"),
    new Course("CTB2200",  "Kansrekening en Statistiek"),
    new Course("EE1M11",   "Linear Algebra and Analysis A"),
    new Course("EE1M21",   "Linear Algebra and Analysis B"),
    new Course("LB1155",   "Calculus"),
    new Course("NB2191",   "Differential Equations"),
    new Course("TB131B",   "Differentiaalvergelijkingen en Lineare Algebra"),
    new Course("TB132B",   "Multivariabele Calculus en Lineaire Algebra"),
    new Course("TN1401WI", "Analyse voor TNW 1"),
    new Course("WBMT",     "Linear Algebra"),
    new Course("WBMT1050", "Calculus for Engineering"),
    new Course("WI1402LR", "Calculus II"),
    new Course("WI1403LR", "Linear Algebra"),
    new Course("WI1421LR", "Calculus I"),
    new Course("WI2031TH", "Probability and Statistics")
]

export let graphs = [
    new Graph(1, "Graph 2021", courses[1]),
    new Graph(2, "Graph 2022", courses[1])
]