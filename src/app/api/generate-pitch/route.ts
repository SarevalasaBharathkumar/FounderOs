import { NextRequest, NextResponse } from 'next/server'
const PptxGenJS = require('pptxgenjs')

type PitchSlide = {
  slideNumber?: number
  title?: string
  subtitle?: string
  bullets?: string[]
  stat?: string
  statLabel?: string
  type?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slides: PitchSlide[] = Array.isArray(body?.slides) ? body.slides : []
    const objective: string = typeof body?.objective === 'string' ? body.objective : ''

    const pres = new PptxGenJS()
    pres.layout = 'LAYOUT_16x9'
    pres.title = 'Investor Pitch Deck'
    pres.author = 'FounderOS'

    const BG = '000000'
    const ACCENT = '6366F1'
    const ACCENT2 = '8B5CF6'
    const WHITE = 'FFFFFF'
    const SUBTEXT = 'A1A1AA'
    const MUTED = '52525B'
    const GREEN = '22C55E'
    const AMBER = 'F59E0B'
    const RED = 'EF4444'

    const typeColors: Record<string, string> = {
      title: ACCENT, cover: ACCENT, problem: RED, solution: GREEN,
      market: AMBER, drawbacks: 'F97316', team: '06B6D4', financialsask: '14B8A6', thankyou: ACCENT2, traction: GREEN, product: ACCENT,
      business: ACCENT2, roadmap: ACCENT2, ask: ACCENT,
    }

    const totalSlides = slides.length
    slides.forEach((slide: PitchSlide, index: number) => {
      const s = pres.addSlide()
      s.background = { color: BG }
      const accentColor = typeColors[slide.type || ''] || ACCENT

      s.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.06,
        fill: { color: accentColor },
        line: { color: accentColor },
      })

      s.addText(`${index + 1}/${totalSlides}`, {
        x: 8.8, y: 5.2, w: 1, h: 0.3,
        fontSize: 9, color: MUTED, fontFace: 'Calibri', margin: 0,
      })

      s.addText('FounderOS', {
        x: 0.3, y: 5.2, w: 2, h: 0.3,
        fontSize: 9, color: MUTED, fontFace: 'Calibri', margin: 0,
      })

      if (slide.type === 'title' || slide.type === 'cover') {
        s.addShape(pres.ShapeType.ellipse, {
          x: 2, y: 0.5, w: 6, h: 4.5,
          fill: { color: accentColor, transparency: 92 },
          line: { color: accentColor, transparency: 92 },
        })

        s.addText(slide.title || 'Startup', {
          x: 0.5, y: slide.type === 'title' ? 1.0 : 1.2, w: 9, h: 1.6,
          fontSize: slide.type === 'title' ? 56 : 50, bold: true, color: WHITE,
          fontFace: 'Calibri', align: 'center', margin: 0, charSpacing: -2,
        })

        s.addText(slide.subtitle || '', {
          x: 0.5, y: 2.8, w: 9, h: 0.6,
          fontSize: 19, color: SUBTEXT,
          fontFace: 'Calibri', align: 'center', margin: 0,
        })

        if (slide.type === 'cover') {
          s.addText(objective ? objective.slice(0, 100) : '', {
            x: 1, y: 3.7, w: 8, h: 0.4,
            fontSize: 11, color: MUTED,
            fontFace: 'Calibri', align: 'center', margin: 0, italic: true,
          })
        }

        s.addShape(pres.ShapeType.rect, {
          x: 3.8, y: 4.4, w: 2.4, h: 0.35,
          fill: { color: accentColor, transparency: 85 },
          line: { color: accentColor },
        })
        s.addText('INVESTOR PITCH DECK', {
          x: 3.8, y: 4.42, w: 2.4, h: 0.3,
          fontSize: 8, bold: true, color: WHITE,
          fontFace: 'Calibri', align: 'center', charSpacing: 2, margin: 0,
        })
      } else if (slide.type === 'thankyou') {
        s.addShape(pres.ShapeType.roundRect, {
          x: 2.1, y: 1.6, w: 5.8, h: 2.6,
          rectRadius: 0.12,
          fill: { color: accentColor, transparency: 86 },
          line: { color: accentColor, transparency: 15, pt: 1.5 },
        })
        s.addText(slide.title || 'Thank You', {
          x: 0.8, y: 2.15, w: 8.4, h: 0.9,
          fontSize: 48, bold: true, color: WHITE,
          fontFace: 'Calibri', align: 'center', margin: 0,
        })
        s.addText(slide.subtitle || '', {
          x: 1.2, y: 3.15, w: 7.6, h: 0.45,
          fontSize: 16, color: SUBTEXT,
          fontFace: 'Calibri', align: 'center', margin: 0,
        })
      } else {
        s.addText((slide.type || '').toUpperCase(), {
          x: 0.4, y: 0.14, w: 5, h: 0.2,
          fontSize: 9, color: accentColor,
          fontFace: 'Calibri', charSpacing: 3, margin: 0,
        })

        s.addText(slide.title || '', {
          x: 0.4, y: 0.42, w: slide.stat ? 6.1 : 9.2, h: 0.95,
          fontSize: 33, bold: true, color: WHITE,
          fontFace: 'Calibri', margin: 0, charSpacing: -1,
        })

        if (slide.subtitle) {
          s.addText(slide.subtitle, {
            x: 0.4, y: 1.32, w: slide.stat ? 6.1 : 9.2, h: 0.52,
            fontSize: 14, color: SUBTEXT,
            fontFace: 'Calibri', margin: 0,
          })
        }

        if (slide.stat) {
          s.addShape(pres.ShapeType.roundRect, {
            x: 6.7, y: 1.02, w: 2.85, h: 3.0,
            rectRadius: 0.08,
            fill: { color: accentColor, transparency: 86 },
            line: { color: accentColor, transparency: 18, pt: 1.2 },
          })
          s.addText(slide.stat, {
            x: 6.7, y: 1.85, w: 2.85, h: 0.9,
            fontSize: 36, bold: true, color: WHITE,
            fontFace: 'Calibri', align: 'center', margin: 0,
          })
          s.addText(slide.statLabel || '', {
            x: 6.7, y: 2.85, w: 2.85, h: 0.36,
            fontSize: 11, color: SUBTEXT,
            fontFace: 'Calibri', align: 'center', margin: 0,
          })
        }

        const bulletItems = Array.isArray(slide.bullets) ? slide.bullets : []
        const bw = slide.stat ? 6.1 : 9.2
        const bulletsData = bulletItems.map((b: string, i: number) => ({
          text: '  ' + b,
          options: {
            breakLine: i < bulletItems.length - 1,
            color: SUBTEXT,
            bullet: { color: accentColor },
          },
        }))
        if (bulletsData.length > 0) {
          s.addText(bulletsData, {
            x: 0.4, y: slide.subtitle ? 2.0 : 1.6,
            w: bw, h: 2.9,
            fontSize: 15, fontFace: 'Calibri',
            margin: 0, paraSpaceAfter: 10,
          })
        }
      }
    })

    const buffer = await pres.write({ outputType: 'arraybuffer' })
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="investor-pitch-deck.pptx"',
        'Content-Length': uint8Array.length.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('PPTX generation error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
